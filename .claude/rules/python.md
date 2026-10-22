# Python Coding Rules

## Type Annotations

- Always add type annotations to all function parameters and return values.
- Use `from __future__ import annotations` at the top of the file when needed for forward references.
- Use types from the `typing` module for complex types (e.g., `Optional`, `Union`, `List`, `Dict`, `Tuple`).
- Prefer built-in generic types (`list[int]`, `dict[str, int]`) over `typing` equivalents when using Python 3.9+.

```python
# Good
def add(x: int, y: int) -> int:
    return x + y

def get_user(user_id: int) -> dict[str, str] | None:
    ...

# Bad
def add(x, y):
    return x + y
```

## Docstrings

- Write all docstrings in **NumPy style**.
- Include a short summary line, followed by an extended description if necessary.
- Document all parameters under `Parameters`, return values under `Returns`, and exceptions under `Raises`.
- Use blank lines to separate sections.

```python
def compute_mean(values: list[float]) -> float:
    """
    Compute the arithmetic mean of a list of numbers.

    Parameters
    ----------
    values : list[float]
        A non-empty list of numeric values.

    Returns
    -------
    float
        The arithmetic mean of the input values.

    Raises
    ------
    ValueError
        If `values` is an empty list.

    Examples
    --------
    >>> compute_mean([1.0, 2.0, 3.0])
    2.0
    """
    if not values:
        raise ValueError("values must not be empty")
    return sum(values) / len(values)
```

### NumPy Docstring Section Order

1. Short summary (one line)
2. Extended description (optional)
3. `Parameters`
4. `Returns`
5. `Raises` (if applicable)
6. `Examples` (if applicable)
