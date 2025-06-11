use tauri::State;

use crate::AppState;

use super::{
    dtos::{ProviderEndpointCallChatData, ProviderEndpointMessage},
    repository::ProviderEndpointRepository,
    service::ProviderEndpointService,
};

#[tauri::command]
pub async fn call_chat<'a>(state: State<'a, AppState>) -> Result<(), String> {
    let data = ProviderEndpointCallChatData {
        provider_model_name: "gpt-3.5-turbo".to_string(),
        messages: vec![
            ProviderEndpointMessage {
                role: "system".to_string(),
                content: "You are a helpful assistant. Provide concise and accurate responses.".to_string(),
            },
            ProviderEndpointMessage {
                role: "user".to_string(),
                content: "Hello, how are you?".to_string(),
            },
            ProviderEndpointMessage {
                role: "assistant".to_string(),
                content: "I'm doing well, thank you for asking. How about you?".to_string(),
            },
            ProviderEndpointMessage {
                role: "user".to_string(),
                content: "I'm fine thanks. Can you explain what JSON templating is?".to_string(),
            },
            ProviderEndpointMessage {
                role: "assistant".to_string(),
                content: "JSON templating is a process of generating JSON documents using template engines. It allows you to create dynamic JSON structures by inserting variables, applying conditionals, and using loops within a template. This is particularly useful when you need to format data according to specific API requirements.".to_string(),
            },
            ProviderEndpointMessage {
                role: "user".to_string(),
                content: "How does it work with different models like GPT?".to_string(),
            },
            ProviderEndpointMessage {
                role: "assistant".to_string(),
                content: "When working with language models like GPT, JSON templating helps format the conversation history and parameters in the exact structure the API expects. For instance, OpenAI's API requires a specific JSON format with 'messages' containing 'role' and 'content' fields, along with model selection and generation parameters. Templating ensures these structured requests are correctly formed regardless of the varying input data from your application.".to_string(),
            },
            ProviderEndpointMessage {
                role: "user".to_string(),
                content: "Can you provide an example of a template for an API call?".to_string(),
            },
            ProviderEndpointMessage {
                role: "assistant".to_string(),
                content: "Here's a simple example of a template for an OpenAI API call using a templating engine like MiniJinja:\n\n```\n{ \"messages\": [ {% for message in messages %} { \"role\": \"{{ message.role }}\", \"content\": \"{{ message.content }}\" }{% if not loop.last %},{% endif %} {% endfor %} ], \"model\": \"{{ model_name }}\", \"temperature\": 0.7 }\n```\n\nThis template iterates through the messages collection and formats each entry according to the API requirements, while also inserting the model name and temperature parameters.".to_string(),
            },
            ProviderEndpointMessage {
                role: "user".to_string(),
                content: "What are some common challenges with JSON templating?".to_string(),
            },
            ProviderEndpointMessage {
                role: "assistant".to_string(),
                content: "Common challenges with JSON templating include:\n\n1. Escaping special characters: Ensuring quotes and backslashes are properly escaped\n2. Handling nested structures: Creating complex nested JSON objects and arrays\n3. Conditional logic: Implementing conditional inclusion of fields\n4. Performance: Optimizing template rendering for large datasets\n5. Error handling: Debugging invalid JSON output\n6. Character encoding: Managing non-ASCII characters properly\n7. Maintainability: Keeping templates readable and manageable as they grow in complexity".to_string(),
            },
        ],
    };

    let repository = ProviderEndpointRepository::new(state.db_pool.clone());
    let service = ProviderEndpointService::new(repository);

    let id = "1";

    service
        .call_chat(&id, data)
        .await
        .map_err(|e| e.to_string());

    Ok(())
}
