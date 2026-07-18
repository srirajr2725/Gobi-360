import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Dimensions,
    ScrollView,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../context/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../utils/apiConfig';

type RootStackParamList = {
    LanguageSelection: undefined;
    Login: undefined;
    UserSignup: undefined;
    UserMainTabs: undefined;
    AdminDashboard: undefined;
    TermsAndConditions: undefined;
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: Props) => {
    const { t, i18n } = useTranslation();
    const { showAlert } = useAlert();
    const isTa = i18n.language === 'ta';
    const [isAdmin, setIsAdmin] = useState(false);

    // User fields
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');

    // Admin fields — Thiran members only
    const ADMIN_EMAIL = 'thiran360@gmail.com';
    const ADMIN_PASSWORD = 'thiran@123';
    const [adminId, setAdminId] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminAccessCode, setShowAdminAccessCode] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 2000);
    };

    const handleLogin = async () => {
        if (isAdmin) {
            if (!adminId.trim() || !accessCode.trim()) {
                showAlert(
                    t('auth_alerts.missing_info'),
                    t('auth_alerts.enter_admin_details')
                );
                return;
            }
            // Strict Thiran member credential check
            if (
                adminId.trim().toLowerCase() === ADMIN_EMAIL &&
                accessCode.trim() === ADMIN_PASSWORD
            ) {
                navigation.replace('AdminDashboard');
            } else {
                showAlert(
                    t('auth_alerts.access_denied'),
                    'Invalid credentials. This portal is restricted to authorised Thiran members only.'
                );
            }
        } else {
            if (!mobileNumber.trim() || !password.trim()) {
                showAlert(
                    t('auth_alerts.missing_info'),
                    t('auth_alerts.enter_user_details')
                );
                return;
            }
            
            setLoading(true);
            try {
                const response = await fetch(ENDPOINTS.login, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                    },
                    body: JSON.stringify({
                        mobile: mobileNumber,
                        password: password,
                    }),
                });

                const data = await response.json();

                if (response.ok && !data.error) {
                    await AsyncStorage.setItem('userSession', JSON.stringify({
                        phoneNumber: mobileNumber,
                        role: 'user',
                        userName: data.full_name || data.name || data.username || data?.data?.full_name || data?.data?.name || data?.data?.username || '',
                        ...data
                    }));
                    
                    const termsAccepted = await AsyncStorage.getItem('termsAccepted');
                    if (termsAccepted === 'true') {
                        navigation.replace('UserMainTabs');
                    } else {
                        navigation.replace('TermsAndConditions');
                    }
                } else {
                    showAlert(
                        t('auth_alerts.login_failed'),
                        data.error || data.message || t('auth_alerts.invalid_creds')
                    );
                }
            } catch (error) {
                showAlert(
                    t('auth_alerts.error'),
                    t('auth_alerts.network_error')
                );
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Premium Background Elements */}
            <View style={styles.backgroundContainer}>
                <View style={[styles.circle, styles.circleTop]} />
                <View style={[styles.circle, styles.circleBottom]} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']}
                            tintColor="#3B82F6"
                        />
                    }
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.mainTitle}>{isAdmin ? t('auth.admin_portal') : t('auth.user_access')}</Text>
                            <Text style={styles.mainSubtitle}>
                                {isAdmin
                                    ? t('auth.secure_admin_platform')
                                    : t('auth.welcome_back')}
                            </Text>
                        </View>

                        {/* Modern Role Switcher */}
                        <View style={styles.switcherWrapper}>
                            <View style={styles.switcherBg}>
                                <TouchableOpacity
                                    style={[styles.switcherTab, !isAdmin && styles.switcherTabActive]}
                                    onPress={() => setIsAdmin(false)}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="account" size={18} color={!isAdmin ? '#3B82F6' : '#94A3B8'} style={styles.switcherIcon} />
                                    <Text style={[styles.switcherText, !isAdmin && styles.switcherTextActive]}>{t('auth.user')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.switcherTab, isAdmin && styles.switcherTabActiveAdmin]}
                                    onPress={() => setIsAdmin(true)}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="shield-account" size={18} color={isAdmin ? '#FFFFFF' : '#94A3B8'} style={styles.switcherIcon} />
                                    <Text style={[styles.switcherText, isAdmin && styles.switcherTextActiveAdmin]}>{t('auth.admin')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formCard}>
                             {!isAdmin ? (
                                <>
                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>{t('auth.mobile_number_label') || "Mobile Number"}</Text>
                                        <View style={styles.inputWrapper}>
                                            <Icon name="phone-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder={t('auth.mobile_number_placeholder') || "Enter mobile number"}
                                                placeholderTextColor="#CBD5E1"
                                                value={mobileNumber}
                                                onChangeText={setMobileNumber}
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>{t('auth.password_label')}</Text>
                                        <View style={styles.inputWrapper}>
                                            <Icon name="lock-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder={t('auth.password_placeholder')}
                                                placeholderTextColor="#CBD5E1"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                                <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>{t('auth.admin_id_label')}</Text>
                                        <View style={styles.inputWrapper}>
                                            <Icon name="badge-account-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="thiran360@gmail.com"
                                                placeholderTextColor="#CBD5E1"
                                                value={adminId}
                                                onChangeText={setAdminId}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                autoCorrect={false}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>{t('auth.access_code_label')}</Text>
                                        <View style={styles.inputWrapper}>
                                            <Icon name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="••••••••"
                                                placeholderTextColor="#CBD5E1"
                                                value={accessCode}
                                                onChangeText={setAccessCode}
                                                secureTextEntry={!showAdminAccessCode}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <TouchableOpacity onPress={() => setShowAdminAccessCode(!showAdminAccessCode)} style={styles.eyeIcon}>
                                                <Icon name={showAdminAccessCode ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )}



                            <TouchableOpacity
                                style={[styles.mainBtn, isAdmin && styles.mainBtnAdmin]}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.mainBtnText}>{isAdmin ? t('auth.launch_console') : t('auth.sign_in')}</Text>
                                        <Icon name="arrow-right" size={20} color="#FFFFFF" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerRegion}>
                            {!isAdmin ? (
                                <View style={styles.signupPrompt}>
                                    <Text style={styles.promptText}>{t('auth.new_to_app')}</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('UserSignup')}>
                                        <Text style={styles.signupLink}>{t('auth.create_account')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.adminStatus}>
                                    <Icon name="alert-octagon" size={16} color="#EF4444" />
                                    <Text style={styles.adminStatusText}>{t('auth.system_admin_only')}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    circle: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
        backgroundColor: '#EFF6FF',
        opacity: 0.8,
    },
    circleTop: {
        top: -width * 0.5,
        right: -width * 0.3,
    },
    circleBottom: {
        bottom: -width * 0.4,
        left: -width * 0.4,
        backgroundColor: '#DBEAFE',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        paddingHorizontal: width * 0.08,
        paddingTop: height * 0.08,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
    },
    mainTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1.5,
        marginBottom: 12,
        lineHeight: 48,
    },
    mainSubtitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 24,
        fontWeight: '500',
    },
    switcherWrapper: {
        marginBottom: 32,
    },
    switcherBg: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        padding: 6,
    },
    switcherTab: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    switcherTabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    switcherTabActiveAdmin: {
        backgroundColor: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
    switcherIcon: {
        marginRight: 8,
    },
    switcherText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94A3B8',
    },
    switcherTextActive: {
        color: '#3B82F6',
    },
    switcherTextActiveAdmin: {
        color: '#FFFFFF',
    },
    formCard: {
        gap: 24,
    },
    fieldGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fieldLabel: {
        width: 100,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
        lineHeight: 18,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 10,
    },
    eyeIcon: {
        padding: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
        lineHeight: 22,
    },

    mainBtn: {
        backgroundColor: '#3B82F6',
        minHeight: 52,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
        gap: 10,
        paddingVertical: 12,
    },
    mainBtnAdmin: {
        backgroundColor: '#0F172A',
        shadowColor: '#000',
    },
    mainBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 26,
    },
    footerRegion: {
        marginTop: 48,
    },
    signupPrompt: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    promptText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 22,
    },
    signupLink: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '800',
        lineHeight: 22,
    },
    adminStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    adminStatusText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 19,
    }
});

export default LoginScreen;
