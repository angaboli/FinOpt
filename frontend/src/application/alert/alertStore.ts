import { create } from "zustand";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  show: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hide: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  buttons: [],

  show(title, message = "", buttons = [{ text: "OK" }]) {
    set({ visible: true, title, message, buttons });
  },

  hide() {
    set({ visible: false });
  },
}));

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => useAlertStore.getState().show(title, message, buttons);
