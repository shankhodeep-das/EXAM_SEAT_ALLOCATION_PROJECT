
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";

import { getStudents } from "../services/api";

type Student = {
  id: number;
  name: string;
  course: string;
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStudents();

      setStudents(data.students);
    } catch (err) {
      console.error("Student API Error:", err);
      setError("Unable to load students. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <View style={styles.container}>

      <Text style={styles.heading}>
        Students List
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#38BDF8"
        />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>

          <Pressable
            style={styles.button}
            onPress={loadStudents}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      ) : students.length === 0 ? (
        <Text style={styles.empty}>
          No students found.
        </Text>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.name}
              </Text>

              <Text style={styles.course}>
                {item.course}
              </Text>
            </View>
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 20,
  },

  heading: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 25,
  },

  list: {
    paddingBottom: 20,
  },

  card: {
    backgroundColor: "#1C1C26",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#30303D",
  },

  name: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  course: {
    fontSize: 14,
    color: "#A1A1AA",
    marginTop: 6,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },

  error: {
    color: "#F87171",
    textAlign: "center",
  },

  empty: {
    color: "#FFFFFF",
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
