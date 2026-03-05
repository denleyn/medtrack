"use client"

import { createContext, useContext, useState, useCallback } from "react"

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQueryState] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const setSearchQuery = useCallback((value) => {
    setSearchQueryState(typeof value === "function" ? value() : value)
  }, [])

  const openSearch = useCallback(() => setIsSearchOpen(true), [])
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQueryState("")
  }, [setSearchQuery])

  const value = {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    openSearch,
    closeSearch,
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) {
    return {
      searchQuery: "",
      setSearchQuery: () => {},
      isSearchOpen: false,
      openSearch: () => {},
      closeSearch: () => {},
    }
  }
  return ctx
}
