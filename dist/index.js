(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.RVBridge = {})));
}(this, (function (exports) { 'use strict';

    /**
     * Preprocess props, distinguish them into '.sync' modifier props
     * and props passed to Vue component
     * @param {Array} props
     * @return {Object} 
     */
    function _preprocessProps() {
      var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var syncProps = [];
      var vueProps = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = props[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var propName = _step.value;
          var syncModifierIndex = propName.lastIndexOf('.');
          var isSyncModifierProp = syncModifierIndex >= 0;

          if (isSyncModifierProp) {
            propName = propName.substring(0, syncModifierIndex);
            syncProps.push(propName);
          }

          vueProps.push(propName);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return {
        syncProps: syncProps,
        vueProps: vueProps
      };
    }
    /**
     * Connect vue props to regular props, therefore when a prop from vue
     * components is updated, regular props can also be updated
     * @param {Object} regularInstance 
     * @param {Object} vueInstance 
     * @param {Array} props 
     * @return {Void}
     */


    function _connectProps(regularInstance, vueInstance) {
      var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        var _loop = function _loop() {
          var propName = _step2.value;
          vueInstance.$watch(propName, function (newValue) {
            if (!regularInstance) {
              return;
            }

            regularInstance.$update(propName, newValue);
          });
        };

        for (var _iterator2 = props[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
    /**
     * Support '.sync' modifier, this syntax is useful if we need
     * dual-direction data binding
     * @param {Object} regularInstance 
     * @param {Object} vueInstance 
     * @param {Array} syncProps 
     */


    function _supportSyncModifer(regularInstance, vueInstance) {
      var syncProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      if (!regularInstance || !vueInstance || syncProps.length === 0) {
        return;
      }

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        var _loop2 = function _loop2() {
          var prop = _step3.value;
          regularInstance.$watch(prop, function (newValue) {
            if (vueInstance[prop] === newValue) {
              return;
            }

            vueInstance.$emit("update:".concat(prop), newValue);
          });
        };

        for (var _iterator3 = syncProps[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          _loop2();
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
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
      var uniqueId = vueInstance._uid;
      var slotId = "__RVBRIDGE_NODE_".concat(uniqueId, "__");
      regularInstance.$body = "<div id=\"".concat(slotId, "\" style=\"height:100%\"></div>");
      regularInstance.$update();
      vueInstance.$nextTick(function () {
        if (!vueInstance.$refs.slot) {
          return;
        }

        var slotElement = document.getElementById(slotId);

        if (!slotElement) {
          vueInstance.$refs.slot.remove();
          return;
        }

        slotElement.appendChild(vueInstance.$refs.slot);
      });
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
        return;
      }

      regularInstance.$on('$destroy', function () {
        vueInstance.$destroy();
      });
    }
    /**
     * When the vue bridge component is destroyed, the regular component
     * connected should be destoryed as well
     * @param {Object} regularInstance 
     * @return {Void}
     */


    function _handleBridgeDestroy(regularInstance) {
      if (!regularInstance) {
        return;
      }

      regularInstance.destroy();
    }
    /**
     * Provide vue components with the ability of invoking regular
     * components, receive a regular component, and finally generate
     * a vue component, just like a bridge between them
     * @param {Function} RegularComponent 
     * @param {Array} props 
     * @return {Object}
     */


    function invoker(RegularComponent) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var _preprocessProps2 = _preprocessProps(props),
          syncProps = _preprocessProps2.syncProps,
          vueProps = _preprocessProps2.vueProps;

      return {
        props: vueProps,
        template: "<div ref=\"container\" style=\"height:100%\"><div ref=\"slot\"><slot></slot></div></div>",
        beforeCreate: function beforeCreate() {
          this.$isRegularBridge = true;
          this.$instance = null;
          this.$bodyContent = '';
        },
        created: function created() {
          var _this = this;

          var vm = this;
          var data = {};
          vueProps.forEach(function (prop) {
            data[prop] = _this[prop];
          });
          this.$instance = new RegularComponent({
            data: data,
            // AOP to enhance the original $emit, support emit events
            // to upper vue components
            $emit: function $emit(eventName) {
              var _RegularComponent$pro;

              for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }

              (_RegularComponent$pro = RegularComponent.prototype.$emit).call.apply(_RegularComponent$pro, [this, eventName].concat(args));

              var filterList = ['$config', '$afterConfig', '$update', '$init', '$afterInit', '$inject'];

              if (!filterList.includes(eventName)) {
                vm.$emit.apply(vm, [eventName].concat(args));
              }
            }
          });

          _handleRegularDestroy(this.$instance, this);

          _connectProps(this.$instance, this, vueProps);

          _supportSyncModifer(this.$instance, this, syncProps);
        },
        mounted: function mounted() {
          this.$instance.$inject(this.$refs.container);

          _supportSlot(this.$instance, this);
        },
        destroyed: function destroyed() {
          _handleBridgeDestroy(this.$instance);
        }
      };
    }

    /**
     * After making the bridge between vue and regular components, we can
     * not get the real regular instance by using `this.$refs.refName`,
     * invoke `getRef(this.$refs.refName)` instead  
     * @param {Object} vueReference 
     * @return {Void|null}
     */
    function getRef(vueReference) {
      if (!vueReference) {
        return null;
      }

      return vueReference.$instance;
    }
    var utils = {
      getRef: getRef
    };

    var utils$1 = /*#__PURE__*/Object.freeze({
        getRef: getRef,
        default: utils
    });

    exports.default = invoker;
    exports.utils = utils$1;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
