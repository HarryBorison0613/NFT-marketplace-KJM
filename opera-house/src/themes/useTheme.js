import { useEffect, useState } from 'react'
import {
  normal,
  dark
} from './index'

function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

const useTheme = (defaultTheme) => {
  const [_theme, _setTheme] = useLocalStorage('theme', defaultTheme)

  const changeTheme = (theme) => {
    const _themeData = theme === 'normal' ? dark : normal

    if (_themeData) {
      for (const [key, value] of Object.entries(_themeData)) {
        const root = document.documentElement;
        root?.style.setProperty(key, value);
      }
    }
  }

  useEffect(() => {
    if (_theme) {
      changeTheme(_theme)
    }
  }, [_theme])

  return {
    changeTheme,
    _theme,
    _setTheme
  }
}

export default useTheme
