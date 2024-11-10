use leptos::*;
use leptos_router::*;

use futures::StreamExt;
use serde::Deserialize;
use tauri_sys::core::Channel;
use tauri_sys::event;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[derive(Clone, PartialEq, Eq, Debug, Deserialize)]
struct MessageEvent {
    message: String,
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;

    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invokeOllama(cmd: &str, args: String, on_event: Channel<MessageEvent>) -> JsValue;
}

async fn call_ollama_model(
    prompt: String,
    on_event: Channel<MessageEvent>,
) -> Result<String, String> {
    invoke("call_ollama_model", &prompt,  &on_event).await.unwrap()

    Ok("Hello from Tauri".to_string())
}

async fn listen_on_generic_event() {
    let mut events = event::listen::<GenericEventRes>("generic-event")
        .await
        .unwrap();

    while let Some(event) = events.next().await {
        event_writer.update(|all_events| all_events.push(event.payload));
    }
}

#[component]
pub fn Home() -> impl IntoView {
    let (event_vec, set_event_vec) = create_signal::<Vec<GenericEventRes>>(vec![]);
    create_local_resource(move || set_event_vec, listen_on_generic_event);

    view! {
        <h1>"Heylo from home"</h1>
        <ul>
                <For each=move || event_vec.get()
                     key=|e|  e.message.clone()
                     children=move |e| {
                       view! {
                         <li>{e.message.clone()}</li>
                       }
                     } />
            </ul>
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
