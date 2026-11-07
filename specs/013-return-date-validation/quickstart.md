# Quickstart: Return Date Validation

## What changed

In `app/components/booking/step-flight-logistics.tsx`, the return date `<input>` now has its `min` attribute dynamically bound to the arrival date when `needReturn` is checked.

## Single-file change

```diff
- <input
-   id="returnDate"
-   type="date"
-   value={data.returnDate}
-   onChange={handleChange('returnDate')}
-   min={minDate}
-   ...
- />
+ <input
+   id="returnDate"
+   type="date"
+   value={data.returnDate}
+   onChange={handleChange('returnDate')}
+   min={data.arrivalDate || minDate}
+   ...
+ />
```

### Additional behavior

- When `arrivalDate` changes and `needReturn` is true and `returnDate < arrivalDate`, `returnDate` is cleared:
  ```ts
  useEffect(() => {
    if (data.needReturn && data.arrivalDate && data.returnDate && data.returnDate < data.arrivalDate) {
      onChange({ ...data, returnDate: '' })
    }
  }, [data.arrivalDate, data.needReturn])
  ```

## Testing

- Open `/booking`, fill arrival date, check return — verify return date picker only allows dates >= arrival date
- Set return date, change arrival to a later date — verify return date is cleared
- Uncheck return — verify return fields hide (existing behavior, unchanged)
