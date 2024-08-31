# dates-manager

A CLI tool for managing dates and converting them into calendar events using customizable event templates.

## Installation

To install, clone the repository and install the required dependencies:
```bash
git clone https://github.com/Ring-r/dates-manager.git
cd ./dates-manager
python3 -m venv ./.venv
source ./.venv/bin/activate
pip install -r ./requirements.txt
```

## Usage

### Create Default Data File

A file `data.json` with default data will be created if it doesn't exist.
```sh
python -m app
```
This will add a single date (today) and two event templates (one with an alarm and one without) to the default data.

### Create Calendar (ICS) File

A file `dates.ics` will be create if `data.json` file exists.
```sh
python -m app
```

### Other Operations

```shell
# print a list of existing event templates:
python -m app get-template-s

# print detailed information about a specific event template:
python -m app get-template

# add information about new date:
python -m app add-date

# print a list of dates information related to specific date:
python -m app get-date-s

# print a list of dates information related to specific event tenplate:
python -m app get-date--s

# remove information about date
python -m app del-date

# assign specific event template related to date information:
python -m app set-date
```

Other operations are not yet implemented and can be performed manually by editing the `data.json` file.
