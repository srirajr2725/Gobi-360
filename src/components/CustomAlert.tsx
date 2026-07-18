import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAlert } from '../context/AlertContext';

const CustomAlert = () => {
  const { alertState, hideAlert } = useAlert();
  const { visible, title, message, buttons } = alertState;

  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  if (!visible && fadeAnim.interpolate({inputRange: [0, 1], outputRange: [0, 1]}) as any === 0) return null;

  const handleButtonPress = (onPress?: () => void) => {
    hideAlert();
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 200); // Wait for exit animation
    }
  };

  const getIcon = () => {
    const t = title.toLowerCase();
    if (t.includes('success')) return <Icon name="check-circle" size={48} color="#10B981" />;
    if (t.includes('error') || t.includes('fail') || t.includes('invalid') || t.includes('mismatch')) return <Icon name="alert-circle" size={48} color="#EF4444" />;
    if (t.includes('confirm') || t.includes('clear')) return <Icon name="help-circle" size={48} color="#3B82F6" />;
    return <Icon name="information" size={48} color="#3B82F6" />;
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={hideAlert}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.alertContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {buttons && buttons.length > 0 ? (
              buttons.map((btn, index) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isDestructive ? styles.buttonDestructive : (isCancel ? styles.buttonCancel : styles.buttonDefault),
                      { flex: 1, marginLeft: index > 0 ? 12 : 0 }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleButtonPress(btn.onPress)}
                  >
                    <Text style={[
                      styles.buttonText,
                      isDestructive ? styles.buttonTextDestructive : (isCancel ? styles.buttonTextCancel : styles.buttonTextDefault)
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonDefault, { flex: 1 }]}
                activeOpacity={0.8}
                onPress={() => handleButtonPress()}
              >
                <Text style={[styles.buttonText, styles.buttonTextDefault]}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDefault: {
    backgroundColor: '#FF5200',
  },
  buttonCancel: {
    backgroundColor: '#F1F5F9',
  },
  buttonDestructive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  buttonTextDefault: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#475569',
  },
  buttonTextDestructive: {
    color: '#EF4444',
  },
});

export default CustomAlert;
