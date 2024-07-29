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

## Step 2: npm-launching script

`<script_location>/solo.sh`

```sh
#!/bin/bash

        (cd <git_repo_directory> && npm start -- $@)
# e.g.  (cd /c/SourceCode/solo   && npm start -- $@)
```

## Step 3: Verification

Restart your terminal and run `solo help`.
