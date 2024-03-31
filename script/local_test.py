#!/bin/env python3

"""
Run local test for the action

Usage:
    python script/local_test.py <config> <data> [--node <node_path>]

Arguments:
    config: str
        Config file (.yaml) path
    data: str
        Data file (.csv) path
        MUST have 'title' and 'issue' columns, each row is a test case
    node: str
        Node.js path, default is 'node'
        MUST have node>=20 installed
    debug: bool
        Enable RUNNER_DEBUG mode, default is False
"""

import argparse
from subprocess import PIPE, Popen

import pandas as pd  # pylint: disable=import-error

parser = argparse.ArgumentParser()
parser.add_argument("config", type=str, help="Config file (.yaml) path")
parser.add_argument("data", type=str, help="Data file (.csv) path")
parser.add_argument("--node", type=str, default="node", help="Node.js path")
parser.add_argument("--debug", action="store_true", help="Enable RUNNER_DEBUG mode")

if __name__ == "__main__":
    args = parser.parse_args()
    print(f"load data from {args.data}")

    data = pd.read_csv(args.data, dtype=str)
    titles = data["title"].to_list()
    issues = data["issue"].to_list()

    for i, (title, issue) in enumerate(zip(titles, issues)):
        print(f"********** TEST ISSUE {i} **********")
        with Popen(
            [args.node, "dist/index.js"],
            stdout=PIPE,
            stderr=PIPE,
            env={
                "INPUT_CONFIG_PATH": args.config,
                "INPUT_LOCAL_TEST_TITLE": title,
                "INPUT_LOCAL_TEST_BODY": issue,
                "RUNNER_DEBUG": "1" if args.debug else "0",
            },
        ) as p:
            p.wait()
            STDOUT = p.communicate()[0].decode()
            print(STDOUT)
            if "::error::" in STDOUT:
                print("Runtime ERROR found")
                break
            print("\n\n")
