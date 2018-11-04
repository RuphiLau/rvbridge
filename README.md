# Introduction
RVBridge is a tool for invoking RegularJS components in a Vue project.

It can bring you the experience of invoking RegularJS components as same as that of vue components.

That's useful when you wanna gradually migrate your old RegularJS projects to Vue projects. You can take it as a transition solution, quickly reuse old Regular components before you rewrite it in Vue.

# Features
- Support passing any types of props
- Support custom events
- Support `.sync` syntax
- Support the default slot as regular's `{#inc this.$body}`
- Support getting `ref` of regular components
- Support auto recycling after components were destroyed

# Installation
```sh
$ npm i -S rvbridge
```
Then, import it into your Vue projects, just like:
```js
import connectFrom, { getRef } from 'rvbridge'
```

# Usage
Use RVBridge to connect Vue components with Regular components, just take two things:

- Firstly, import Regular components:
```js
import _Switcher from '@/regular/components/switcher'
```
- Secondly, invoke RVBridge:
```js
const Switcher = connectFrom(_Switcher, ['checked'])
```
Now, you can use the component like a Vue component, for example:
```js
export default {
    // ...
    data() {
        return {
            checked: false
        }
    },
    components: {
        Switcher
    },
    methods: {
        handleToggle() {
            this.checked = !this.checked
        }
    }
}
```
templates are like:
```html
<switcher :checked="checked" @toggle="handleToggle" />
```

# Tips
- You should manually declare props in the stage of connecting to expose props. The way of declaration is passing them to the second param of `connectFrom()`. For example, the `Switcher` component has a `checked` prop, so add it to the props array param. 
- If you wanna implement the same effects like regular's dual-direction data binding. Use vue's `.sync` syntax and declare it including `.sync` as well. For example:
```html
<sample-comp :value.sync="value" />
```
```js
const SampleComp = connectFrom(_SampleComp, ['value.sync'])
```
- If you wanna get the reference of components, instead of using `this.$refs.refName`, you should use `getRef(this.$refs.refName)` to get the real Regular components' instance. `getRef()` is an util provided by RVBridge.
- You can freely use default slot as regular components' `this.$body`, there are no limits of slot contents, and Vue's DOM-Diff patch will still work.