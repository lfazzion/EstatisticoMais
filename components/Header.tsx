// components/Header.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function Header({ title, showBackButton = false }: HeaderProps) {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const openMenu = () => {
    if (showBackButton) {
      navigation.goBack();
    } else {
      navigation.openDrawer();
    }
  };

  const openProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={openMenu}>
        <Ionicons name={showBackButton ? 'arrow-back' : 'menu'} size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerText}>{title}</Text>
      <TouchableOpacity onPress={openProfile}>
        <Ionicons name="person-circle" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ajuste para a barra de status
    height: Platform.OS === 'android' ? 60 + StatusBar.currentHeight! : 60,
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
