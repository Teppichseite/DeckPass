def escape_cli_input(input_str: str) -> str:
    escaped = input_str.replace('"', '\\"')
    return f'"{escaped}"'
