import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { X, Plus } from 'lucide-react-native';

interface Item {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
}

interface Suggestion {
  id: string;
  name: string;
}

const API_URL = 'https://mycustomlist.onrender.com';

export default function TabOneScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/myproducts`);
      const data = await response.json();
      setItems(
        data.map((item: any) => ({ id: item.id.toString(), name: item.name }))
      );
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/search?name=${query}`);
      const data = await response.json();
      const filteredSuggestions = data
        .filter(
          (item: any) =>
            !items.some((existing) => existing.id === item.id.toString())
        )
        .map((item: any) => ({ id: item.id.toString(), name: item.name }));

      setSuggestions(filteredSuggestions);
      setNoResults(filteredSuggestions.length === 0);
    } catch (error) {
      console.error('Error searching items:', error);
      setNoResults(true);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setShowSuggestions(true);
    searchItems(text);
  };

  const addItem = async (suggestion: Suggestion) => {
    try {
      const response = await fetch(`${API_URL}/myproducts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: suggestion.name,
          description: '',
          price: 0,
          imageUrl: '',
        }),
      });

      if (response.ok) {
        setItems([...items, suggestion]);
        setSearch('');
        setSuggestions([]);
        setShowSuggestions(false);
        setNoResults(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const addCustomItem = async () => {
    if (!search.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      name: search.trim(),
    };

    try {
      const response = await fetch(`${API_URL}/myproducts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItem.name,
          description: '',
          price: 0,
          imageUrl: '',
        }),
      });

      if (response.ok) {
        setItems([...items, newItem]);
        setSearch('');
        setSuggestions([]);
        setShowSuggestions(false);
        setNoResults(false);
      }
    } catch (error) {
      console.error('Error adding custom item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/myproducts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(items.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Item>) => {
      return (
        <ScaleDecorator>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.itemContainer,
              { backgroundColor: isActive ? '#E3E3E3' : '#FFF' },
            ]}
          >
            <Text style={styles.itemText} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={styles.deleteButton}
            >
              <X size={20} color="#FF0000" />
            </TouchableOpacity>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const onDragEnd = async ({ data }: { data: Item[] }) => {
    setItems(data);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={search}
            onChangeText={handleSearch}
          />
          {search.trim().length > 0 && (
            <TouchableOpacity style={styles.addButton} onPress={addCustomItem}>
              <Plus size={24} color="#0000ff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSuggestions && (suggestions.length > 0 || noResults) && (
        <View style={styles.suggestionsContainer}>
          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => addItem(item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                  <Plus size={20} color="#0000ff" />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No matches found. Use the + button to add "{search}" as a new
                item.
              </Text>
            </View>
          )}
        </View>
      )}

      <DraggableFlatList
        data={items}
        onDragEnd={onDragEnd}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  deleteButton: {
    padding: 4,
  },
});
