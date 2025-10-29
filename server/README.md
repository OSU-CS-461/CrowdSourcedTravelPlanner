# Python Install

## MacOS

1. `brew install pyenv`
2. `pyenv install 3.10.1`
3. `pyenv global 3.10.1`

# Python Environment Setup

Pipenv docs: https://pipenv.pypa.io/en/latest/
Reference: https://flask.palletsprojects.com/en/stable/installation/

- Install pipenv, which managed our python dependencies: `pip install --user pipenv`
- Install the dependencies with pipenv: `pipenv install`

# Dependency Management

Dependendies are managed with pipenv. More information can be found in the [documentation here](https://pipenv.pypa.io/en/latest/).

# Running the Server in Dev Mode

Run the start script with `pipenv run dev`.
