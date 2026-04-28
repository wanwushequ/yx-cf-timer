// Last auto-trigger: 2026-04-29 18:35:00 (Beijing Time)
export default {
  // 1. 处理浏览器访问
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/") {
      return new Response("Ignored", { status: 200 });
    }

    try {
      await this.triggerAllWorkflows(env);
      return new Response("✅ 所有 GitHub Actions 已顺序触发！");
    } catch (err) {
      return new Response(`❌ 触发逻辑出错: ${err.message}`, { status: 500 });
    }
  },

  // 2. 处理定时任务
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.triggerAllWorkflows(env));
  },

  // 核心：顺序触发所有配置的 YML，并增加间隔 
  async triggerAllWorkflows(env) {
    const workflows = [
      "tiancheng.yml",
      "vvhan.yml",
      "xinyitang3.yml",
      "gslege.yml",
      "nirevil.yml",
      "mingyu.yml",
      "zhixuanwang.yml",
      "vps789.yml"
    ];

    console.log(`开始顺序触发任务，共 ${workflows.length} 个...`);

    for (const yml of workflows) {
      try {
        await this.triggerWithRetry(env, yml, 2);
        console.log(`[${yml}] 触发成功`);
      } catch (err) {
        console.error(`[${yml}] 最终失败: ${err.message}`);
      }

      if (yml !== workflows[workflows.length - 1]) {
        console.log(`等待 10 秒后再触发下一个任务...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  },

  // 3. 带重试逻辑的包装函数（保持不变）
  async triggerWithRetry(env, workflowId, maxRetries) {
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        await this.triggerGitHub(env, workflowId);
        return; 
      } catch (err) {
        attempts++;
        if (attempts > maxRetries) throw err; 
        
        console.warn(`[${workflowId}] 第 ${attempts} 次失败: ${err.message}，2秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  },

  // 4. 核心触发函数（保持不变） 
  async triggerGitHub(env, workflowId) {
    const github_user = "wanwushequ";
    const github_repo = "cfyxip";
    const github_token = env.GITHUB_TOKEN; 

    const url = `https://api.github.com/repos/${github_user}/${github_repo}/actions/workflows/${workflowId}/dispatches`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${github_token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Cloudflare-Worker-Trigger"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (res.status !== 204) {
      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    }
  }
};