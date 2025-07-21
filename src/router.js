import { createRouter, createWebHistory } from "vue-router";

// Lazy loading routes
const routes = [
    { path: "/", component: () => import("./views/Home.vue"), meta: { title: null, h1: "TaiwanFRP" } },
    { path: "/admin", component: () => import("./views/Admin.vue"), meta: { title: "管理員中心", h1: "管理員面板" } },
    { path: "/editini", component: () => import("./views/Editini.vue"), meta: { title: "編輯配置", h1: "編輯代理" } },
    { path: "/howto", component: () => import("./views/HowTo.vue"), meta: { title: "如何使用", h1: "如何使用 TaiwanFRP" } },
    { path: "/login", component: () => import("./views/Login.vue"), meta: { title: "登入", h1: " 登入 TaiwanFRP 帳號" } },
    { path: "/partner", component: () => import("./views/Partner.vue"), meta: { title: "成為合作夥伴", h1: " 成為 TaiwanFRP 合作夥伴" } },
    { path: "/register", component: () => import("./views/Register.vue"), meta: { title: "註冊", h1: "註冊 TaiwanFRP 帳號" } },
    { path: "/terms", component: () => import("./views/Terms.vue"), meta: { title: "隱私權政策", h1: "TaiwanFRP 服務條款" } },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const baseTitle = "TaiwanFRP";
    const pageTitle = to.meta.title || "Minecraft 伺服器穿透服務";
    document.title = pageTitle ? `${baseTitle} - ${pageTitle}` : baseTitle;
    next();
});

export default router;