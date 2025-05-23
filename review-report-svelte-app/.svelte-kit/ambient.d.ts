
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const NVM_INC: string;
	export const NODE: string;
	export const INIT_CWD: string;
	export const ANDROID_HOME: string;
	export const NVM_CD_FLAGS: string;
	export const TERM: string;
	export const SHELL: string;
	export const npm_config_metrics_registry: string;
	export const TMPDIR: string;
	export const npm_config_global_prefix: string;
	export const npm_package_optional: string;
	export const COLOR: string;
	export const TERM_SESSION_ID: string;
	export const npm_config_noproxy: string;
	export const SDKMAN_PLATFORM: string;
	export const npm_config_local_prefix: string;
	export const __INTELLIJ_COMMAND_HISTFILE__: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const COMMAND_MODE: string;
	export const npm_config_globalconfig: string;
	export const SDKMAN_CANDIDATES_API: string;
	export const npm_package_peer: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const LOGIN_SHELL: string;
	export const npm_package_integrity: string;
	export const PATH: string;
	export const TERMINAL_EMULATOR: string;
	export const npm_package_json: string;
	export const npm_config_engine_strict: string;
	export const _: string;
	export const npm_config_userconfig: string;
	export const npm_config_init_module: string;
	export const __CFBundleIdentifier: string;
	export const npm_command: string;
	export const PWD: string;
	export const JAVA_HOME: string;
	export const npm_lifecycle_event: string;
	export const EDITOR: string;
	export const npm_package_name: string;
	export const npm_config_resolution_mode: string;
	export const CLOUDSDK_PYTHON: string;
	export const XPC_FLAGS: string;
	export const npm_package_engines_node: string;
	export const npm_config_node_gyp: string;
	export const npm_package_dev: string;
	export const npm_package_version: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_resolved: string;
	export const SHLVL: string;
	export const HOME: string;
	export const npm_package_dev_optional: string;
	export const npm_config_cache: string;
	export const LOGNAME: string;
	export const npm_lifecycle_script: string;
	export const SDKMAN_DIR: string;
	export const LC_CTYPE: string;
	export const NVM_BIN: string;
	export const npm_config_user_agent: string;
	export const SDKMAN_CANDIDATES_DIR: string;
	export const npm_node_execpath: string;
	export const npm_config_prefix: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		NVM_INC: string;
		NODE: string;
		INIT_CWD: string;
		ANDROID_HOME: string;
		NVM_CD_FLAGS: string;
		TERM: string;
		SHELL: string;
		npm_config_metrics_registry: string;
		TMPDIR: string;
		npm_config_global_prefix: string;
		npm_package_optional: string;
		COLOR: string;
		TERM_SESSION_ID: string;
		npm_config_noproxy: string;
		SDKMAN_PLATFORM: string;
		npm_config_local_prefix: string;
		__INTELLIJ_COMMAND_HISTFILE__: string;
		NVM_DIR: string;
		USER: string;
		COMMAND_MODE: string;
		npm_config_globalconfig: string;
		SDKMAN_CANDIDATES_API: string;
		npm_package_peer: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		LOGIN_SHELL: string;
		npm_package_integrity: string;
		PATH: string;
		TERMINAL_EMULATOR: string;
		npm_package_json: string;
		npm_config_engine_strict: string;
		_: string;
		npm_config_userconfig: string;
		npm_config_init_module: string;
		__CFBundleIdentifier: string;
		npm_command: string;
		PWD: string;
		JAVA_HOME: string;
		npm_lifecycle_event: string;
		EDITOR: string;
		npm_package_name: string;
		npm_config_resolution_mode: string;
		CLOUDSDK_PYTHON: string;
		XPC_FLAGS: string;
		npm_package_engines_node: string;
		npm_config_node_gyp: string;
		npm_package_dev: string;
		npm_package_version: string;
		XPC_SERVICE_NAME: string;
		npm_package_resolved: string;
		SHLVL: string;
		HOME: string;
		npm_package_dev_optional: string;
		npm_config_cache: string;
		LOGNAME: string;
		npm_lifecycle_script: string;
		SDKMAN_DIR: string;
		LC_CTYPE: string;
		NVM_BIN: string;
		npm_config_user_agent: string;
		SDKMAN_CANDIDATES_DIR: string;
		npm_node_execpath: string;
		npm_config_prefix: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
