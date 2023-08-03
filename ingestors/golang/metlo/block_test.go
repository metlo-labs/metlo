package metlo

import (
	"testing"
)

func TestGetKeyValuePairValue(t *testing.T) {
	keyValuePairs := []NV{
		{Name: "key1", Value: "value1"},
		{Name: "key2", Value: "value2"},
		{Name: "key3", Value: "value3"},
	}

	t.Run("Existing key, case insensitive", func(t *testing.T) {
		key := "KEY1"
		expectedValue := "value1"

		result := GetKeyValuePairValue(key, keyValuePairs)

		if result == nil {
			t.Errorf("Expected value for key '%s' to be '%s', but got nil", key, expectedValue)
		} else if *result != expectedValue {
			t.Errorf("Expected value for key '%s' to be '%s', but got '%s'", key, expectedValue, *result)
		}
	})

	t.Run("Existing key, exact match", func(t *testing.T) {
		key := "key3"
		expectedValue := "value3"

		result := GetKeyValuePairValue(key, keyValuePairs)

		if result == nil {
			t.Errorf("Expected value for key '%s' to be '%s', but got nil", key, expectedValue)
		} else if *result != expectedValue {
			t.Errorf("Expected value for key '%s' to be '%s', but got '%s'", key, expectedValue, *result)
		}
	})

	t.Run("Non-existing key", func(t *testing.T) {
		key := "nonexistent"
		result := GetKeyValuePairValue(key, keyValuePairs)

		if result != nil {
			t.Errorf("Expected value for non-existing key '%s' to be nil, but got '%s'", key, *result)
		}
	})
}
