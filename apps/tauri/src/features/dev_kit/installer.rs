use std::fs;
use std::path::PathBuf;
use std::process::Command;

/// Manages proto installation and updates in an isolated directory
/// Only supports macOS and operates independently from system-installed proto
pub struct ProtoManager {
    /// The isolated .proto directory where proto will be installed
    proto_home: PathBuf,
    /// The proto binary path within the isolated directory
    proto_bin: PathBuf,
}

impl ProtoManager {
    /// Creates a new ProtoManager that will manage proto in {app_dir}/.proto
    ///
    /// # Arguments
    /// * `app_dir` - The application directory where .proto folder will be created
    ///
    /// # Example
    /// ```
    /// let manager = ProtoManager::new(PathBuf::from("/path/to/app"));
    /// // This will manage proto in /path/to/app/.proto
    /// ```
    pub fn new(app_dir: PathBuf) -> Self {
        let proto_home = app_dir.join(".proto");
        let proto_bin = proto_home.join("bin").join("proto");

        Self {
            proto_home,
            proto_bin,
        }
    }

    /// Installs proto if it's not already installed in our isolated directory
    /// Uses the official proto installation script from moonrepo.dev
    ///
    /// # Returns
    /// * `Ok(())` if proto is already installed or installation succeeds
    /// * `Err` if installation fails
    pub fn install_if_needed(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Check if proto is already installed in our isolated directory
        if self.is_proto_installed() {
            println!("Proto is already installed in isolated directory");
            return Ok(());
        }

        println!(
            "Installing proto in isolated directory: {}",
            self.proto_home.display()
        );
        self.install_proto()
    }

    /// Updates proto to the latest version using proto's built-in upgrade command
    ///
    /// # Returns
    /// * `Ok(())` if update succeeds
    /// * `Err` if update fails or proto is not installed
    pub fn update(&self) -> Result<(), Box<dyn std::error::Error>> {
        if !self.is_proto_installed() {
            return Err("Proto is not installed. Run install_if_needed() first.".into());
        }

        println!("Updating proto...");

        let output = Command::new(&self.proto_bin)
            .arg("upgrade")
            .env("PROTO_HOME", &self.proto_home)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to update proto: {}", stderr).into());
        }

        println!("Proto updated successfully");
        Ok(())
    }

    /// Installs a tool using proto install command
    ///
    /// # Arguments
    /// * `tool` - The tool to install (e.g., "node", "deno", "bun")
    /// * `version` - Optional version to install. If None, installs latest
    /// * `pin` - Whether to pin the version after installation (makes binary available)
    ///
    /// # Example
    /// ```
    /// // Install latest Node.js and pin it
    /// manager.install_tool("node", None, true)?;
    ///
    /// // Install specific Deno version without pinning
    /// manager.install_tool("deno", Some("1.40.0"), false)?;
    /// ```
    pub fn install_tool(
        &self,
        tool: &str,
        version: Option<&str>,
        pin: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if !self.is_proto_installed() {
            return Err("Proto is not installed. Run install_if_needed() first.".into());
        }

        println!("Installing tool: {} (version: {:?})", tool, version);

        let mut cmd = Command::new(&self.proto_bin);
        cmd.arg("install")
            .arg(tool)
            .env("PROTO_HOME", &self.proto_home);

        // Add version if specified
        if let Some(v) = version {
            cmd.arg(v);
        }

        // Add pin flag if requested
        if pin {
            cmd.arg("--pin");
        }

        let output = cmd.output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to install tool '{}': {}", tool, stderr).into());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("Tool '{}' installed successfully:\n{}", tool, stdout);
        Ok(())
    }

    /// Runs a tool with arguments using proto run command
    /// This is like `npx some-pkg something...` but using proto
    ///
    /// # Arguments
    /// * `tool` - The tool to run (e.g., "node", "deno", "bun")
    /// * `version` - Optional specific version to run
    /// * `args` - Arguments to pass to the tool
    ///
    /// # Example
    /// ```
    /// // Run a Node.js script
    /// manager.run_tool("node", None, &["script.js"])?;
    ///
    /// // Run a specific version of Deno with args
    /// manager.run_tool("deno", Some("1.40.0"), &["run", "--allow-net", "server.ts"])?;
    ///
    /// // Run bun with multiple args (like npx some-pkg something...)
    /// manager.run_tool("bun", None, &["run", "build"])?;
    /// ```
    pub fn run_tool(
        &self,
        tool: &str,
        version: Option<&str>,
        args: &[&str],
    ) -> Result<std::process::Output, Box<dyn std::error::Error>> {
        if !self.is_proto_installed() {
            return Err("Proto is not installed. Run install_if_needed() first.".into());
        }

        println!(
            "Running tool: {} (version: {:?}) with args: {:?}",
            tool, version, args
        );

        let mut cmd = Command::new(&self.proto_bin);
        cmd.arg("run").arg(tool).env("PROTO_HOME", &self.proto_home);

        // Add version if specified
        if let Some(v) = version {
            cmd.arg(v);
        }

        // Add separator and arguments for the tool
        if !args.is_empty() {
            cmd.arg("--").args(args);
        }

        println!("Command: {:?}", cmd);

        let output = cmd.output()?;

        // Note: We return the output instead of checking success here
        // This allows the caller to handle both success and failure cases
        // Some tools might return non-zero exit codes for valid reasons
        println!(
            "Tool '{}' execution completed with exit code: {}",
            tool, output.status
        );

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        if !stdout.is_empty() {
            println!("STDOUT:\n{}", stdout);
        }

        if !stderr.is_empty() {
            println!("STDERR:\n{}", stderr);
        }

        if stdout.is_empty() && stderr.is_empty() {
            println!("No output from tool execution");
        }

        Ok(output)
    }

    /// Returns the path to the isolated proto home directory
    pub fn proto_home(&self) -> &PathBuf {
        &self.proto_home
    }

    /// Returns the path to the proto binary in the isolated directory
    pub fn proto_bin(&self) -> &PathBuf {
        &self.proto_bin
    }

    /// Checks if proto is installed and ready to use
    pub fn is_installed(&self) -> bool {
        self.is_proto_installed()
    }

    /// Checks if proto is installed in our isolated directory
    fn is_proto_installed(&self) -> bool {
        self.proto_bin.exists() && self.proto_bin.is_file()
    }

    /// Actually installs proto using the official installation script
    /// Simple approach - will fail on paths with spaces until upstream fix
    fn install_proto(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Ensure our proto directory exists
        fs::create_dir_all(&self.proto_home)?;

        println!("Installing proto to: {}", self.proto_home.display());

        // Simple installation command - no workarounds
        let install_script =
            "curl -fsSL https://moonrepo.dev/install/proto.sh | bash -s -- --yes --no-profile";

        let output = Command::new("bash")
            .arg("-c")
            .arg(install_script)
            .env("PROTO_HOME", &self.proto_home)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to install proto: {}", stderr).into());
        }

        // Verify that proto was actually installed
        if !self.is_proto_installed() {
            return Err("Proto installation completed but binary not found".into());
        }

        println!(
            "Proto installed successfully at: {}",
            self.proto_bin.display()
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_proto_manager_creation() {
        let temp_dir = env::temp_dir().join("test_proto");
        let manager = ProtoManager::new(temp_dir.clone());

        assert_eq!(manager.proto_home(), &temp_dir.join(".proto"));
        assert_eq!(
            manager.proto_bin(),
            &temp_dir.join(".proto").join("bin").join("proto")
        );
    }

    #[test]
    fn test_is_proto_installed_when_not_installed() {
        let temp_dir = env::temp_dir().join("test_proto_not_installed");
        let manager = ProtoManager::new(temp_dir);

        assert!(!manager.is_proto_installed());
    }
}
