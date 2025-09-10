import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useStore = create(
  devtools((set) => ({
    formSubmitted: false,
    dataReady: false,
    response: null, // add response here
    avatar:0,

    toggleFormSubmitted: () =>
      set((state) => ({ formSubmitted: !state.formSubmitted })),

    setDataReady: () =>
      set((state) => ({ dataReady: !state.dataReady })),

    setAvatar: (index) => set({ avatar: index }),

    setResponse: (data) => set({ response: data }), // setter for response
  }))
);

export default useStore;
