//! Dev Kit Core Module
//!
//! This module provides a unified interface for managing development tools
//! in an isolated environment. Currently supports proto installation and management,
//! including installing and running tools through proto.
//!
//! # Usage Example
//!
//! ```rust
//! use std::path::PathBuf;
//! use mynth_app::features::dev_kit::{DevKit, ProtoManager};
//!
//! // Using DevKit (recommended for managing multiple tools)
//! let dev_kit = DevKit::new(PathBuf::from("/path/to/app"));
//! dev_kit.ensure_tools_installed().expect("Failed to install tools");
//!
//! // Install and run development tools
//! dev_kit.install_tool("node", None, true).expect("Failed to install Node.js");
//! dev_kit.install_tool("pnpm", Some("8.15.0"), true).expect("Failed to install pnpm");
//!
//! // Run tools with arguments (like npx some-pkg something...)
//! let output = dev_kit.run_tool("node", None, &["--version"]).expect("Failed to run node");
//! let output = dev_kit.run_tool("pnpm", None, &["install"]).expect("Failed to run pnpm");
//!
//! // Or using ProtoManager directly for proto-only operations
//! let proto_manager = ProtoManager::new(PathBuf::from("/path/to/app"));
//! proto_manager.install_if_needed().expect("Failed to install proto");
//! proto_manager.update().expect("Failed to update proto");
//! proto_manager.install_tool("deno", None, true).expect("Failed to install Deno");
//!
//! // Proto will be installed to: /path/to/app/.proto/
//! // Proto binary will be at: /path/to/app/.proto/bin/proto
//! ```

use super::installer::ProtoManager;

/// Dev Kit manager that coordinates all development tools
/// Currently focused on proto, but designed to be extensible for future tools
pub struct DevKit {
    app_dir: std::path::PathBuf,
    proto_manager: ProtoManager,
}

impl DevKit {
    /// Creates a new DevKit instance for the given app directory
    ///
    /// # Arguments
    /// * `app_dir` - The application directory where dev tools will be managed
    ///
    /// # Example
    /// ```
    /// use std::path::PathBuf;
    ///
    /// let dev_kit = DevKit::new(PathBuf::from("/path/to/app"));
    /// ```
    pub fn new(app_dir: std::path::PathBuf) -> Self {
        let proto_manager = ProtoManager::new(app_dir.clone());

        Self {
            app_dir,
            proto_manager,
        }
    }

    /// Returns a reference to the proto manager
    /// Use this to install, update, or manage proto
    pub fn proto(&self) -> &ProtoManager {
        &self.proto_manager
    }

    /// Returns the app directory path
    pub fn app_dir(&self) -> &std::path::PathBuf {
        &self.app_dir
    }

    /// Ensures all essential dev tools are installed
    /// Currently only installs proto, but will be extended for other tools
    pub fn ensure_tools_installed(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Install proto if needed
        self.proto_manager.install_if_needed()?;

        // Future: Install other dev tools here (Node.js, Python, etc.)

        Ok(())
    }

    /// Checks if all dev tools are ready to use
    /// Returns true if proto is installed and ready
    pub fn is_ready(&self) -> bool {
        self.proto_manager.is_installed()
    }

    /// Gets the installation status of all dev tools
    pub fn get_status(&self) -> DevKitStatus {
        DevKitStatus {
            proto_installed: self.proto_manager.is_installed(),
            proto_path: self.proto_manager.proto_bin().clone(),
        }
    }

    /// Installs a development tool using proto
    ///
    /// # Arguments
    /// * `tool` - The tool to install (e.g., "node", "deno", "bun", "pnpm")
    /// * `version` - Optional version to install. If None, installs latest
    /// * `pin` - Whether to pin the version after installation (makes binary available)
    ///
    /// # Example
    /// ```
    /// // Install latest Node.js and make it available
    /// dev_kit.install_tool("node", None, true)?;
    ///
    /// // Install specific pnpm version
    /// dev_kit.install_tool("pnpm", Some("8.15.0"), true)?;
    /// ```
    pub fn install_tool(
        &self,
        tool: &str,
        version: Option<&str>,
        pin: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.proto_manager.install_tool(tool, version, pin)
    }

    /// Runs a development tool with arguments using proto
    /// Similar to `npx some-pkg something...` but using proto's tool management
    ///
    /// # Arguments
    /// * `tool` - The tool to run (e.g., "node", "deno", "bun")
    /// * `version` - Optional specific version to run
    /// * `args` - Arguments to pass to the tool
    ///
    /// # Example
    /// ```
    /// // Run a Node.js script
    /// let output = dev_kit.run_tool("node", None, &["--version"])?;
    ///
    /// // Run pnpm install
    /// let output = dev_kit.run_tool("pnpm", None, &["install"])?;
    ///
    /// // Run a specific bun version with build command
    /// let output = dev_kit.run_tool("bun", Some("1.0.0"), &["run", "build"])?;
    /// ```
    pub fn run_tool(
        &self,
        tool: &str,
        version: Option<&str>,
        args: &[&str],
    ) -> Result<std::process::Output, Box<dyn std::error::Error>> {
        self.proto_manager.run_tool(tool, version, args)
    }
}

/// Status information about dev kit tools
#[derive(Debug, Clone)]
pub struct DevKitStatus {
    pub proto_installed: bool,
    pub proto_path: std::path::PathBuf,
}
