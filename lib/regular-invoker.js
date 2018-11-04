/**
 * Preprocess props, distinguish them into '.sync' modifier props
 * and props passed to Vue component
 * @param {Array} props
 * @return {Object} 
 */
function _preprocessProps(props = []) {
    const syncProps = []
    const vueProps = []
    for (let propName of props) {
        const syncModifierIndex = propName.lastIndexOf('.')
        const isSyncModifierProp = syncModifierIndex >= 0
        if (isSyncModifierProp) {
            propName = propName.substring(0, syncModifierIndex)
            syncProps.push(propName)
        }
        vueProps.push(propName)
    }
    return { syncProps, vueProps }
}

/**
 * Connect vue props to regular props, therefore when a prop from vue
 * components is updated, regular props can also be updated
 * @param {Object} regularInstance 
 * @param {Object} vueInstance 
 * @param {Array} props 
 * @return {Void}
 */
function _connectProps(regularInstance, vueInstance, props = []) {
    for (const propName of props) {
        vueInstance.$watch(propName, newValue => {
            if (!regularInstance) {
                return
            }
            regularInstance.$update(propName, newValue)
        })
    }
}

/**
 * Support '.sync' modifier, this syntax is useful if we need
 * dual-direction data binding
 * @param {Object} regularInstance 
 * @param {Object} vueInstance 
 * @param {Array} syncProps 
 */
function _supportSyncModifer(regularInstance, vueInstance, syncProps = []) {
    if (!regularInstance || !vueInstance || syncProps.length === 0) {
        return
    }
    for (const prop of syncProps) {
        regularInstance.$watch(prop, newValue => {
            if (vueInstance[prop] === newValue) {
                return
            }
            vueInstance.$emit(`update:${prop}`, newValue)
        })
    }
}

/**
 * Support connect default slot of vue components to `{#inc this.$body}` of regular
 * components
 * @param {Object} regularInstance 
 * @param {Object} vueInstance 
 * @return {Void}
 */
function _supportSlot(regularInstance, vueInstance) {
    const uniqueId = vueInstance._uid
    const slotId = `__RVBRIDGE_NODE_${uniqueId}__`
    regularInstance.$body = `<div id="${slotId}" style="height:100%"></div>`
    regularInstance.$update()
    vueInstance.$nextTick(() => {
        if (!vueInstance.$refs.slot) {
            return
        }
        const slotElement = document.getElementById(slotId)
        if (!slotElement) {
            vueInstance.$refs.slot.remove()
            return
        }
        slotElement.appendChild(vueInstance.$refs.slot)
    })
}

/**
 * Once a regular component is destroyed, the vue bridge component
 * should be cleaned up
 * @param {Object} regularInstance 
 * @param {Object} vueInstance 
 * @return {Void}
 */
function _handleRegularDestroy(regularInstance, vueInstance) {
    if (!regularInstance || !vueInstance) {
        return
    }
    regularInstance.$on('$destroy', () => {
        vueInstance.$destroy()
    })
}

/**
 * When the vue bridge component is destroyed, the regular component
 * connected should be destoryed as well
 * @param {Object} regularInstance 
 * @return {Void}
 */
function _handleBridgeDestroy(regularInstance) {
    if (!regularInstance) {
        return
    }
    regularInstance.destroy()
}

/**
 * Provide vue components with the ability of invoking regular
 * components, receive a regular component, and finally generate
 * a vue component, just like a bridge between them
 * @param {Function} RegularComponent 
 * @param {Array} props 
 * @return {Object}
 */
export default function invoker(RegularComponent, props = []) {
    const { syncProps, vueProps } = _preprocessProps(props)
    return {
        props: vueProps,
        template: `<div ref="container" style="height:100%"><div ref="slot"><slot></slot></div></div>`,
        beforeCreate() {
            this.$isRegularBridge = true
            this.$instance = null
            this.$bodyContent = ''
        },
        created() {
            const vm = this
            const data = {}
            vueProps.forEach(prop => {
                data[prop] = this[prop]
            })
            this.$instance = new RegularComponent({
                data,
                // AOP to enhance the original $emit, support emit events
                // to upper vue components
                $emit(eventName, ...args) {
                    RegularComponent.prototype.$emit.call(this, eventName, ...args)
                    const filterList = ['$config', '$afterConfig', '$update', '$init', '$afterInit', '$inject']
                    if (!filterList.includes(eventName)) {
                        vm.$emit(eventName, ...args)
                    }
                }
            })
            _handleRegularDestroy(this.$instance, this)
            _connectProps(this.$instance, this, vueProps)
            _supportSyncModifer(this.$instance, this, syncProps)
        },
        mounted() {
            this.$instance.$inject(this.$refs.container)
            _supportSlot(this.$instance, this)
        },
        destroyed() {
            _handleBridgeDestroy(this.$instance)
        }
    }
}