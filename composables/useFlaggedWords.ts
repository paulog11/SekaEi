import { storeToRefs } from 'pinia'
import { useFlaggedWordsStore } from '~/stores/flaggedWordsStore'

export function useFlaggedWords() {
  const store = useFlaggedWordsStore()
  const { words, loading, error } = storeToRefs(store)
  return {
    words,
    loading,
    error,
    isFlagged: store.isFlagged,
    fetchWords: store.fetchWords,
    flag: store.flag,
    unflag: store.unflag,
  }
}
