use security_framework::os::macos::keychain::SecKeychain;
use std::result::Result;

// Name of the service used to identify entries in the keychain
const SERVICE_NAME: &str = "MynthApp";

/// Stores an API key securely in the macOS keychain
///
/// # Arguments
/// * `api_key_id` - A string identifier for the API key (e.g., "openai")
/// * `api_key` - The actual API key value to store
///
/// # Returns
/// * `Ok(())` if the operation was successful
/// * `Err(String)` with the error message if it failed
pub fn store_api_key(api_key_id: &str, api_key: &str) -> Result<(), String> {
    SecKeychain::default()
        .map_err(|e| e.to_string())?
        .set_generic_password(SERVICE_NAME, api_key_id, api_key.as_bytes())
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Retrieves an API key from the macOS keychain
///
/// # Arguments
/// * `api_key_id` - The identifier of the API key to retrieve
///
/// # Returns
/// * `Ok(String)` with the API key if found
/// * `Err(String)` with the error message if it failed
pub fn get_api_key(api_key_id: &str) -> Result<String, String> {
    let (password, _) = SecKeychain::default()
        .map_err(|e| e.to_string())?
        .find_generic_password(SERVICE_NAME, api_key_id)
        .map_err(|e| e.to_string())?;

    String::from_utf8(password.to_vec()).map_err(|e| e.to_string())
}

/// Deletes an API key from the macOS keychain
///
/// # Arguments
/// * `api_key_id` - The identifier of the API key to delete
///
/// # Returns
/// * `Ok(())` if the operation was successful
/// * `Err(String)` with the error message if it failed
pub fn delete_api_key(api_key_id: &str) -> Result<(), String> {
    let (_, item) = SecKeychain::default()
        .map_err(|e| e.to_string())?
        .find_generic_password(SERVICE_NAME, api_key_id)
        .map_err(|e| e.to_string())?;

    item.delete();
    Ok(())
}
