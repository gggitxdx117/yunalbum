<template>
	<!-- #ifdef WEB -->
	<tbody>
		<slot></slot>
	</tbody>
	<!-- #endif -->
	<!-- #ifndef H5 -->
	<view><slot></slot></view>
	<!-- #endif -->
</template>

<script>
export default {
	name: 'uniBody',
	options: {
		virtualHost: true
	},
	data() {
		return {
			
		}
	},
	created() {},
	methods: {}
}
</script>

<style>
</style>
