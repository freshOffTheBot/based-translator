#!/usr/bin/env bash

#
#	# ELECTRON BUILD IN LOCAL WINDOWS v1.0
#	- Build the Electron app on a remote Windows machine through OpenSSH.
#	- The Linux machine zips the project, sends it to Windows, runs npm build commands,
#	  then downloads the final build zip back to Linux.
#
#	## Prerequisite
#	- Linux has zip, scp, and ssh installed.
#	- Windows has OpenSSH server enabled and reachable through WINDOWS_SSH_ALIAS.
#	- Windows has portable Node.js with node.exe and npm.cmd at WINDOWS_NODE_FOLDER_PATH.
#	- WINDOWS_PROJ_FOLDER_PATH can be created or cleaned by the SSH user.
#
#	## How To Use
#	01. Update the variables in the [Config] section below.
#	02. Make sure the Windows machine is reachable through the SSH alias.
#	03. Make sure portable Node.js exists at WINDOWS_NODE_FOLDER_PATH.
#	04. Run: bash 02_script/01_electronBuildInLocalWindows/v1_electronBuildInLocalWindows.sh
#	05. Review the summary, type yes, then wait for the build zip.
#

set -euo pipefail


#
#	## Config
#	- Update these values before running the script.
#	- Example values are comments only. Keep real values in the variables below.
#

# Example: basedTranslator-temp.zip
LINUX_TEMP_ZIP_FILENAME="basedTranslator-temp.zip"

# Example: /home/myuser/myworkspace/01_release/v0.5.0
LINUX_FINAL_ZIP_FOLDER_PATH=""

# Example: my-windows
# - This must match an SSH host alias from ~/.ssh/config, or a value like user@192.168.1.10.
WINDOWS_SSH_ALIAS=""

# Example: C:/Users/myuser/Desktop/based-translator-build
# - Use forward slashes to avoid backslash escaping problems in scp paths.
WINDOWS_PROJ_FOLDER_PATH=""

# Example: C:/Users/myuser/App/Node/node-v22.13.1-win-x64
# - This folder must contain node.exe and npm.cmd.
WINDOWS_NODE_FOLDER_PATH=""

# Example: src/02_electron/out/Based Translator-win32-x64
# - This path starts from WINDOWS_PROJ_FOLDER_PATH.
# - This is the folder that gets zipped after npm run electron:build.
WINDOWS_BUILD_OUTPUT_PATH="src/02_electron/out/Based Translator-win32-x64"


#
#	## Colors
#	- Keep terminal output easy to scan.
#
COLOR_RESET="\033[0m"
COLOR_BLUE="\033[34m"
COLOR_CYAN="\033[36m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"
COLOR_BOLD="\033[1m"

STEP_CURRENT=0
STEP_TOTAL=9


#
#	## Logging
#	- Small helpers for consistent script output.
#
function log_step() {
	STEP_CURRENT=$((STEP_CURRENT + 1))

	printf "\n${COLOR_BLUE}${COLOR_BOLD}[%d/%d]${COLOR_RESET} ${COLOR_BOLD}%s${COLOR_RESET}\n" "$STEP_CURRENT" "$STEP_TOTAL" "$1"
}

function log_info() {
	printf "${COLOR_GREEN}[info]${COLOR_RESET} %s\n" "$1"
}

function log_warn() {
	printf "${COLOR_YELLOW}[warn]${COLOR_RESET} %s\n" "$1"
}

function log_error() {
	printf "${COLOR_RED}[error]${COLOR_RESET} %s\n" "$1" >&2
}

function fail() {
	log_error "$1"
	exit 1
}


#
#	## Validation
#	- Fail before doing remote work when config or local tools are missing.
#
function require_value() {
	local name="$1"
	local value="${!name}"

	if [[ -z "$value" ]]; then
		fail "$name is not set. Update the config section at the top of this script."
	fi
}

function require_command() {
	local command_name="$1"

	if ! command -v "$command_name" >/dev/null 2>&1; then
		fail "$command_name is required but was not found."
	fi
}

function validate_config() {
	require_value "LINUX_TEMP_ZIP_FILENAME"
	require_value "LINUX_FINAL_ZIP_FOLDER_PATH"
	require_value "WINDOWS_SSH_ALIAS"
	require_value "WINDOWS_PROJ_FOLDER_PATH"
	require_value "WINDOWS_NODE_FOLDER_PATH"
	require_value "WINDOWS_BUILD_OUTPUT_PATH"

	require_command "zip"
	require_command "scp"
	require_command "ssh"

	if [[ ! -d "$LINUX_FINAL_ZIP_FOLDER_PATH" ]]; then
		fail "LINUX_FINAL_ZIP_FOLDER_PATH does not exist: $LINUX_FINAL_ZIP_FOLDER_PATH"
	fi

	log_info "Validated required variables and local commands."
}


#
#	## PowerShell Helpers
#	- Send scripts through stdin so Windows paths do not fight shell quoting.
#
function ps_quote() {
	local value="$1"

	printf "'%s'" "${value//\'/\'\'}"
}

function run_windows_ps() {
	local ps_script="$1"

	ssh "$WINDOWS_SSH_ALIAS" "powershell -NoProfile -ExecutionPolicy Bypass -Command -" <<< "$ps_script"
}

function run_windows_step() {
	local step_name="$1"
	local ps_script="$2"

	log_step "$step_name"
	run_windows_ps "$ps_script"
}


#
#	## Confirm
#	- Show the build target before deleting or copying anything.
#
function confirm_start() {
	local summary_title="ELECTRON BUILD IN LOCAL WINDOWS"
	local summary_width=60
	local summary_rows=(
		"  Temp zip       : $LINUX_TEMP_ZIP_FILENAME"
		"  Final folder   : $LINUX_FINAL_ZIP_FOLDER_PATH"
		"  SSH alias      : $WINDOWS_SSH_ALIAS"
		"  Project path   : $WINDOWS_PROJ_FOLDER_PATH"
		"  Node path      : $WINDOWS_NODE_FOLDER_PATH"
		"  Build output   : $WINDOWS_BUILD_OUTPUT_PATH"
		"  Full output    : $WINDOWS_PROJ_FOLDER_PATH/$WINDOWS_BUILD_OUTPUT_PATH"
	)

	for summary_row in "${summary_rows[@]}"; do
		if (( ${#summary_row} > summary_width )); then
			summary_width="${#summary_row}"
		fi
	done

	if (( ${#summary_title} > summary_width )); then
		summary_width="${#summary_title}"
	fi

	function print_summary_border() {
		printf "${COLOR_BLUE}+"
		printf '%*s' "$((summary_width + 2))" "" | tr ' ' '-'
		printf "+${COLOR_RESET}\n"
	}

	function print_summary_empty_row() {
		printf "${COLOR_BLUE}|${COLOR_RESET} %*s ${COLOR_BLUE}|${COLOR_RESET}\n" "$summary_width" ""
	}

	function print_summary_title_row() {
		local padding
		padding=$((summary_width - ${#summary_title}))

		printf "${COLOR_BLUE}|${COLOR_RESET} ${COLOR_BOLD}${COLOR_CYAN}%s${COLOR_RESET}%*s ${COLOR_BLUE}|${COLOR_RESET}\n" "$summary_title" "$padding" ""
	}

	function print_summary_section_row() {
		local section_title="$1"
		local plain_text="$section_title"
		local padding
		padding=$((summary_width - ${#plain_text}))

		printf "${COLOR_BLUE}|${COLOR_RESET} ${COLOR_YELLOW}%s${COLOR_RESET}%*s ${COLOR_BLUE}|${COLOR_RESET}\n" "$section_title" "$padding" ""
	}

	function print_summary_value_row() {
		local label="$1"
		local value="$2"
		local plain_text="  $label : $value"
		local padding
		padding=$((summary_width - ${#plain_text}))

		printf "${COLOR_BLUE}|${COLOR_RESET}   %s : ${COLOR_GREEN}%s${COLOR_RESET}%*s ${COLOR_BLUE}|${COLOR_RESET}\n" "$label" "$value" "$padding" ""
	}

	printf "\n"
	print_summary_border
	print_summary_title_row
	print_summary_border
	print_summary_section_row "LINUX"
	print_summary_value_row "Temp zip      " "$LINUX_TEMP_ZIP_FILENAME"
	print_summary_value_row "Final folder  " "$LINUX_FINAL_ZIP_FOLDER_PATH"
	print_summary_empty_row
	print_summary_section_row "WINDOWS"
	print_summary_value_row "SSH alias     " "$WINDOWS_SSH_ALIAS"
	print_summary_value_row "Project path  " "$WINDOWS_PROJ_FOLDER_PATH"
	print_summary_value_row "Node path     " "$WINDOWS_NODE_FOLDER_PATH"
	print_summary_value_row "Build output  " "$WINDOWS_BUILD_OUTPUT_PATH"
	print_summary_value_row "Full output   " "$WINDOWS_PROJ_FOLDER_PATH/$WINDOWS_BUILD_OUTPUT_PATH"
	print_summary_border
	printf "\n${COLOR_YELLOW}Type ${COLOR_GREEN}${COLOR_BOLD}yes${COLOR_RESET}${COLOR_YELLOW} to start${COLOR_RESET}  >  "
	read -r answer

	if [[ "$answer" != "yes" ]]; then
		fail "Canceled by user."
	fi

	log_info "User confirmed the build summary."
}

function confirm_remote_folder_cleanup() {
	local windows_proj_folder_path_ps
	windows_proj_folder_path_ps="$(ps_quote "$WINDOWS_PROJ_FOLDER_PATH")"

	log_step "Checking Windows project folder"

	local remote_folder_has_content
	remote_folder_has_content="$(
		run_windows_ps "\
\$ErrorActionPreference = 'Stop'
\$ProjectPath = $windows_proj_folder_path_ps
if (!(Test-Path -LiteralPath \$ProjectPath)) {
	New-Item -ItemType Directory -Path \$ProjectPath | Out-Null
	Write-Output 'created'
	exit 0
}

\$FirstItem = Get-ChildItem -LiteralPath \$ProjectPath -Force | Select-Object -First 1
if (\$null -eq \$FirstItem) {
	Write-Output 'empty'
	exit 0
}

Write-Output 'not-empty'
"
	)"

	if [[ "$remote_folder_has_content" == *"created"* ]]; then
		log_info "Created Windows project folder."
		return
	fi

	if [[ "$remote_folder_has_content" == *"empty"* ]]; then
		log_info "Windows project folder is empty."
		return
	fi

	log_warn "Windows project folder is not empty: $WINDOWS_PROJ_FOLDER_PATH"
	printf "Type yes to delete all contents in that folder: "
	read -r answer

	if [[ "$answer" != "yes" ]]; then
		fail "Canceled before deleting Windows project folder contents."
	fi

	log_info "Deleting existing contents in Windows project folder."
	run_windows_ps "\
\$ErrorActionPreference = 'Stop'
\$ProjectPath = $windows_proj_folder_path_ps
Get-ChildItem -LiteralPath \$ProjectPath -Force | Remove-Item -Recurse -Force
"

	log_info "Deleted all existing contents in Windows project folder."
}


#
#	## Build Steps
#	- Keep each step small so failures are easy to locate.
#
function create_linux_temp_zip() {
	log_step "Creating Linux temp zip"

	if [[ -f "$LINUX_TEMP_ZIP_FILENAME" ]]; then
		log_info "Deleting old temp zip: $LINUX_TEMP_ZIP_FILENAME"
		rm -f "$LINUX_TEMP_ZIP_FILENAME"
		log_info "Deleted old Linux temp zip."
	fi

	zip -r "$LINUX_TEMP_ZIP_FILENAME" . \
		-x "$LINUX_TEMP_ZIP_FILENAME" \
		-x "src/01_webapp/node_modules/*" \
		-x "src/02_electron/node_modules/*" \
		-x ".state/*" \
		-x ".codex/*" \
		-x ".git/*" \
		-x ".worktree/*"

	log_info "Created Linux temp zip: $LINUX_TEMP_ZIP_FILENAME"
}

function copy_temp_zip_to_windows() {
	log_step "Copying temp zip to Windows"

	scp "$LINUX_TEMP_ZIP_FILENAME" "$WINDOWS_SSH_ALIAS:$WINDOWS_PROJ_FOLDER_PATH"
	log_info "Copied temp zip to Windows project folder: $WINDOWS_PROJ_FOLDER_PATH"

	log_info "Deleting Linux temp zip."
	rm -f "$LINUX_TEMP_ZIP_FILENAME"
	log_info "Deleted Linux temp zip after upload."
}

function prepare_windows_project() {
	local linux_temp_zip_filename_ps
	local windows_proj_folder_path_ps

	linux_temp_zip_filename_ps="$(ps_quote "$LINUX_TEMP_ZIP_FILENAME")"
	windows_proj_folder_path_ps="$(ps_quote "$WINDOWS_PROJ_FOLDER_PATH")"

	run_windows_step "Unzipping project on Windows" "\
\$ErrorActionPreference = 'Stop'
\$ProjectPath = $windows_proj_folder_path_ps
\$ZipPath = Join-Path \$ProjectPath $linux_temp_zip_filename_ps

if (!(Test-Path -LiteralPath \$ZipPath)) {
	throw \"Temp zip was not found: \$ZipPath\"
}

Expand-Archive -LiteralPath \$ZipPath -DestinationPath \$ProjectPath -Force
Remove-Item -LiteralPath \$ZipPath -Force
"

	log_info "Unzipped project files into Windows project folder."
	log_info "Deleted temp zip from Windows project folder."
}

function run_windows_npm_script() {
	local step_name="$1"
	local npm_script="$2"
	local should_verify_build_output="$3"
	local windows_proj_folder_path_ps
	local windows_node_folder_path_ps
	local windows_build_output_path_ps
	local npm_script_ps

	windows_proj_folder_path_ps="$(ps_quote "$WINDOWS_PROJ_FOLDER_PATH")"
	windows_node_folder_path_ps="$(ps_quote "$WINDOWS_NODE_FOLDER_PATH")"
	windows_build_output_path_ps="$(ps_quote "$WINDOWS_BUILD_OUTPUT_PATH")"
	npm_script_ps="$(ps_quote "$npm_script")"

	run_windows_step "$step_name" "\
\$ErrorActionPreference = 'Stop'
\$ProjectPath = $windows_proj_folder_path_ps
\$NodePath = $windows_node_folder_path_ps
\$BuildOutputPath = Join-Path \$ProjectPath $windows_build_output_path_ps
\$NpmScript = $npm_script_ps

if (!(Test-Path -LiteralPath \$NodePath)) {
	throw \"WINDOWS_NODE_FOLDER_PATH does not exist: \$NodePath\"
}

\$env:Path = \"\$NodePath;\$env:Path\"

foreach (\$CommandName in @('node.exe', 'npm.cmd')) {
	if (\$null -eq (Get-Command \$CommandName -ErrorAction SilentlyContinue)) {
		throw \"Portable Node command not found after PATH update: \$CommandName\"
	}
}

Set-Location -LiteralPath \$ProjectPath

Write-Output \"[windows] npm run \$NpmScript\"
npm run \$NpmScript

if (\$LASTEXITCODE -ne 0) {
	throw \"npm run \$NpmScript failed with exit code \$LASTEXITCODE\"
}

if ('$should_verify_build_output' -eq 'yes' -and !(Test-Path -LiteralPath \$BuildOutputPath)) {
	throw \"WINDOWS_BUILD_OUTPUT_PATH does not exist after build: \$BuildOutputPath\"
}
"
}

function run_windows_build() {
	run_windows_npm_script "Installing webapp dependencies on Windows" "webapp:install" "no"
	log_info "Installed webapp dependencies on Windows."

	run_windows_npm_script "Installing Electron dependencies on Windows" "electron:install" "no"
	log_info "Installed Electron dependencies on Windows."

	run_windows_npm_script "Building Electron app on Windows" "electron:build" "yes"
	log_info "Built Electron app on Windows."
	log_info "Verified Windows build output folder: $WINDOWS_PROJ_FOLDER_PATH/$WINDOWS_BUILD_OUTPUT_PATH"
}

function create_windows_final_zip() {
	local windows_proj_folder_path_ps
	local windows_node_folder_path_ps
	local windows_build_output_path_ps

	windows_proj_folder_path_ps="$(ps_quote "$WINDOWS_PROJ_FOLDER_PATH")"
	windows_node_folder_path_ps="$(ps_quote "$WINDOWS_NODE_FOLDER_PATH")"
	windows_build_output_path_ps="$(ps_quote "$WINDOWS_BUILD_OUTPUT_PATH")"

	run_windows_ps "\
\$ErrorActionPreference = 'Stop'
\$ProjectPath = $windows_proj_folder_path_ps
\$NodePath = $windows_node_folder_path_ps
\$BuildOutputPath = Join-Path \$ProjectPath $windows_build_output_path_ps
\$env:Path = \"\$NodePath;\$env:Path\"

Set-Location -LiteralPath \$ProjectPath

\$PackageJson = Get-Content -LiteralPath (Join-Path \$ProjectPath 'package.json') -Raw | ConvertFrom-Json
\$Version = \$PackageJson.version
if ([string]::IsNullOrWhiteSpace(\$Version)) {
	throw 'Root package.json version is empty.'
}

\$ZipName = \"basedTranslator-portable-v\$Version.zip\"
\$ZipPath = Join-Path \$ProjectPath \$ZipName

if (Test-Path -LiteralPath \$ZipPath) {
	Remove-Item -LiteralPath \$ZipPath -Force
}

Compress-Archive -LiteralPath \$BuildOutputPath -DestinationPath \$ZipPath -Force
Write-Output \$ZipName
"
}

function copy_final_zip_to_linux() {
	local final_zip_filename="$1"
	local linux_final_zip_path="$LINUX_FINAL_ZIP_FOLDER_PATH/$final_zip_filename"

	log_step "Copying final zip to Linux"

	if [[ -f "$linux_final_zip_path" ]]; then
		log_info "Deleting old Linux final zip: $linux_final_zip_path"
		rm -f "$linux_final_zip_path"
		log_info "Deleted old Linux final zip."
	fi

	scp "$WINDOWS_SSH_ALIAS:$WINDOWS_PROJ_FOLDER_PATH/$final_zip_filename" "$LINUX_FINAL_ZIP_FOLDER_PATH/"
	log_info "Copied final zip to Linux: $linux_final_zip_path"
}

function delete_windows_final_zip() {
	local final_zip_filename="$1"
	local final_zip_filename_ps
	local windows_proj_folder_path_ps

	final_zip_filename_ps="$(ps_quote "$final_zip_filename")"
	windows_proj_folder_path_ps="$(ps_quote "$WINDOWS_PROJ_FOLDER_PATH")"

	log_info "Deleting final zip from Windows project folder."
	run_windows_ps "\
\$ErrorActionPreference = 'Stop'
\$ProjectPath = $windows_proj_folder_path_ps
\$ZipPath = Join-Path \$ProjectPath $final_zip_filename_ps

if (Test-Path -LiteralPath \$ZipPath) {
	Remove-Item -LiteralPath \$ZipPath -Force
}
"

	log_info "Deleted final zip from Windows project folder."
}

function main() {
	validate_config
	confirm_start
	confirm_remote_folder_cleanup
	create_linux_temp_zip
	copy_temp_zip_to_windows
	prepare_windows_project
	run_windows_build

	local final_zip_filename
	log_step "Creating final Windows build zip"
	final_zip_filename="$(create_windows_final_zip | tr -d '\r' | tail -n 1)"
	log_info "Created final Windows build zip: $final_zip_filename"

	copy_final_zip_to_linux "$final_zip_filename"
	delete_windows_final_zip "$final_zip_filename"

	printf "\n${COLOR_GREEN}${COLOR_BOLD}Done${COLOR_RESET}\n"
	log_info "Final build zip: $LINUX_FINAL_ZIP_FOLDER_PATH/$final_zip_filename"
}

main "$@"
