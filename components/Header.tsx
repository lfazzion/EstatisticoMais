// components/Header.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightButton?: React.ReactNode;
}

export default function Header({ title, showBackButton = false, rightButton }: HeaderProps) {
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu}>
          <Ionicons name={showBackButton ? 'arrow-back' : 'menu'} size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{title}</Text>
        {rightButton ? (
          rightButton
        ) : (
          <TouchableOpacity onPress={openProfile}>
            <Ionicons name="person-circle" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#4caf50',
  },
  header: {
    height: 60,
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
