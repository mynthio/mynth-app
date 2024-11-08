use leptos::*;
use leptos_router::*;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

#[component]
pub fn Home() -> impl IntoView {
    view! {
        <h1>"Heylo from home"</h1>
    }
}

#[component]
pub fn Settings() -> impl IntoView {
    view! {
        <h1>"Heylo from settings"</h1>
    }
}

#[component]
pub fn App() -> impl IntoView {
    view! {
        <div>
        <Router>
        <nav>
        <a href="/">"Home"</a>
        <a href="/settings">"Settings"</a>
        </nav>
        <main>
        <Routes>
        <Route path="/" view=Home/>
        <Route path="/settings" view=Settings/>
        </Routes>
        </main>
        </Router>
        </div>
    }
}
