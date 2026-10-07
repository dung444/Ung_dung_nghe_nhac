import { create } from "zustand";

interface LibraryState {
  savedAlbumIds: string[];
  addAlbumToLibrary: (albumId: string) => void;
  removeAlbumFromLibrary: (albumId: string) => void;
  toggleAlbumSaved: (albumId: string) => boolean;
  isAlbumSaved: (albumId: string) => boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // Khởi tạo một số album mẫu được lưu mặc định nếu có
  savedAlbumIds: ["album-1", "album-2"],

  addAlbumToLibrary: (albumId: string) => {
    set((state) => {
      if (state.savedAlbumIds.includes(albumId)) return state;
      return { savedAlbumIds: [...state.savedAlbumIds, albumId] };
    });
  },

  removeAlbumFromLibrary: (albumId: string) => {
    set((state) => ({
      savedAlbumIds: state.savedAlbumIds.filter((id) => id !== albumId),
    }));
  },

  toggleAlbumSaved: (albumId: string) => {
    const isSaved = get().savedAlbumIds.includes(albumId);
    if (isSaved) {
      get().removeAlbumFromLibrary(albumId);
      return false;
    } else {
      get().addAlbumToLibrary(albumId);
      return true;
    }
  },

  isAlbumSaved: (albumId: string) => {
    return get().savedAlbumIds.includes(albumId);
  },
}));
