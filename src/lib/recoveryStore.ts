import { writable } from "svelte/store";

const STORAGE_KEY = "interauth:recoveryEmail";

function readStored(): string {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v || "";
  } catch (e) {
    return "";
  }
}

function writeStored(val: string) {
  try {
    if (val) sessionStorage.setItem(STORAGE_KEY, val);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore storage errors
  }
}

export const recoveryEmail = writable<string>(readStored());

recoveryEmail.subscribe((v) => writeStored(v));
