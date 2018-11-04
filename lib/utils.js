/**
 * After making the bridge between vue and regular components, we can
 * not get the real regular instance by using `this.$refs.refName`,
 * invoke `getRef(this.$refs.refName)` instead  
 * @param {Object} vueReference 
 * @return {Void|null}
 */
export function getRef(vueReference) {
    if (!vueReference) {
        return null
    }
    return vueReference.$instance
}

export default {
    getRef
}