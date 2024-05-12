import{_ as s,c as a,o as i,a1 as t}from"./chunks/framework.DeZZNaSL.js";const g=JSON.parse('{"title":"transform","description":"","frontmatter":{},"headers":[],"relativePath":"commands/transform.md","filePath":"commands/transform.md"}'),e={name:"commands/transform.md"},n=t('<h1 id="transform" tabindex="-1">transform <a class="header-anchor" href="#transform" aria-label="Permalink to &quot;transform&quot;">​</a></h1><p>批量转换文件</p><h2 id="用法" tabindex="-1">用法 <a class="header-anchor" href="#用法" aria-label="Permalink to &quot;用法&quot;">​</a></h2><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-_PMIk" id="tab-gg7sQZ2" checked="checked"><label for="tab-gg7sQZ2">npm</label><input type="radio" name="group-_PMIk" id="tab-bioK8Im"><label for="tab-bioK8Im">pnpm</label><input type="radio" name="group-_PMIk" id="tab-copjrx0"><label for="tab-copjrx0">yarn</label></div><div class="blocks"><div class="language-sh vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span></span></code></pre></div><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> pnpm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span></span></code></pre></div><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> yarn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span></span></code></pre></div></div></div><p>启动<code>观察模式</code></p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-EB_52" id="tab-tOHKCq2" checked="checked"><label for="tab-tOHKCq2">npm</label><input type="radio" name="group-EB_52" id="tab-K1xIOiJ"><label for="tab-K1xIOiJ">pnpm</label><input type="radio" name="group-EB_52" id="tab-vFlTojM"><label for="tab-vFlTojM">yarn</label></div><div class="blocks"><div class="language-sh vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -w</span></span>\n<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 或者</span></span>\n<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --watch</span></span></code></pre></div><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> pnpm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -w</span></span>\n<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 或者</span></span>\n<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> pnpm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --watch</span></span></code></pre></div><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> yarn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -w</span></span>\n<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 或者</span></span>\n<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> yarn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> transform</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --watch</span></span></code></pre></div></div></div><h2 id="配置" tabindex="-1">配置 <a class="header-anchor" href="#配置" aria-label="Permalink to &quot;配置&quot;">​</a></h2><p>在对应的<code>unbag.config.js</code>的<code>transform</code>的属性设置配置</p><h3 id="entry" tabindex="-1"><code>entry</code> <a class="header-anchor" href="#entry" aria-label="Permalink to &quot;`entry`&quot;">​</a></h3><ul><li>类型:<code>string</code></li><li>是否必填：是</li><li>需要转换的源码文件夹的相对路径，相对于配置文件</li></ul><h3 id="sourcemap" tabindex="-1"><code>sourcemap</code> <a class="header-anchor" href="#sourcemap" aria-label="Permalink to &quot;`sourcemap`&quot;">​</a></h3><ul><li>类型:<code>boolean</code></li><li>默认值:<code>false</code></li><li>是否输出sourcemap</li></ul><h3 id="plugins" tabindex="-1"><code>plugins</code> <a class="header-anchor" href="#plugins" aria-label="Permalink to &quot;`plugins`&quot;">​</a></h3><ul><li>类型:<code>Plugin[]</code></li><li>是否必填：是</li><li>插件配置</li></ul>',14),l=[n];function p(h,r,d,o,k,c){return i(),a("div",null,l)}const u=s(e,[["render",p]]);export{g as __pageData,u as default};
