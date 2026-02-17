import { supabase } from '@/src/lib/supabase'
import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // --- SIGN UP ---
  async function handleSignUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Account created! Check your email.')
    }
  }

  // --- SIGN IN ---
  async function handleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Logged in!')
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.buttons}>
          <Button mode="contained" onPress={handleSignIn}>
            Sign In
          </Button>
          <Button mode="outlined" onPress={handleSignUp} style={{ marginTop: 12 }}>
            Sign Up
          </Button>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  buttons: {
    marginTop: 8,
  },
})