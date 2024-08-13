# README

## Installation

Currently, only installation from Git repo (sources) is available.
The two steps below can be merged into one.

### Step 1: bash profile function

Register script in `~/.bash_profile`

```sh
solo() {
    sh <script_location>/solo.sh $1
}
```

### Step 2: npm-launching script

`<script_location>/solo.sh`

```sh
#!/bin/bash

        (cd <git_repo_directory> && npm start -- $@)
# e.g.  (cd /c/SourceCode/solo   && npm start -- $@)
```

### Step 3: Verification

Restart your terminal and run `solo help`.

## Prerequisites

No specific versions are known right now as official prerequisites.

The tool has been tested/used under the following environment:

```sh
$ nvm --version
1.1.11

$ node --version
v22.2.0

$ npm --version
10.7.0
```

## Roadmap

* Monorepo
  * [ ] `mono-analyze`
  * [x] `mono-run-many`
* Git
  * [x] `git-repo-stats`
* NPM
  * [x] `npm-audit`
* ADO
  * [x] `ado-list-remote-repos`
  * [ ] `ado-list-deploys`
* Self-diagnostic
  * [ ] `solo-check-health`

## Examples

```sh
npm start -- git-repo-stats -p 4s-ownership -c /c/SourceCode/solo.json -a 2024-01-01
```