import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Modal,
    Text,
    TouchableOpacity,
    AppState,
    AppStateStatus,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPendingCallInfo, clearPendingCallInfo, CallInfo } from '../utils/callTracker';
import { saveMissedCall } from '../utils/missedCallsStore';
import { ENDPOINTS } from '../utils/apiConfig';

const GlobalCallTracker: React.FC = () => {
    const [showAttendedModal, setShowAttendedModal] = useState(false);
    const [showOneTouchModal, setShowOneTouchModal] = useState(false);
    const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextState === 'active'
            ) {
                const info = await getPendingCallInfo();
                if (info) {
                    // Check if the call was recent (within last 30 minutes) to avoid stale modals
                    const isRecent = Date.now() - info.timestamp < 30 * 60 * 1000;
                    if (isRecent) {
                        setActiveCall(info);
                        // Small delay to ensure app is fully in foreground
                        setTimeout(() => setShowAttendedModal(true), 800);
                    }
                    // Always clear info once we've seen it (or if it's stale)
                    await clearPendingCallInfo();
                }
            }
            appStateRef.current = nextState;
        });

        return () => subscription.remove();
    }, []);

    const handleCallStatus = async (status: 'attended' | 'not_attended') => {
        if (!activeCall) return;
        setShowAttendedModal(false);

        try {
            const raw = await AsyncStorage.getItem('userSession');
            const session = raw ? JSON.parse(raw) : {};

            const userName: string =
                session.userName ||
                session.full_name ||
                session.name ||
                session.fullName ||
                session.customer_name ||
                session.customerName ||
                session.user_name ||
                session.username ||
                session.displayName ||
                session.display_name ||
                session?.data?.full_name ||
                session?.data?.name ||
                session?.data?.userName ||
                session?.data?.username ||
                session?.data?.user_name ||
                session?.user?.full_name ||
                session?.user?.name ||
                (session.first_name
                    ? `${session.first_name} ${session.last_name || ''}`.trim()
                    : null) ||
                (session?.data?.first_name
                    ? `${session.data.first_name} ${session.data.last_name || ''}`.trim()
                    : null) ||
                'Unknown User';

            const userPhone: string =
                session.phoneNumber ||
                session.mobile ||
                session.phone ||
                session.mobileNumber ||
                'Unknown Number';

            const payload = {
                customer: activeCall.businessName,
                customer_number: activeCall.phoneNumber,
                user_name: userName,
                user_number: userPhone,
                status: status,
                remarks: status === 'attended' ? 'Call completed successfully' : 'Call was not attended',
            };

            fetch(ENDPOINTS.callLog, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(payload),
            })
            .then(res => console.log('GlobalCallTracker: API POST success:', res.status))
            .catch(err => console.error('GlobalCallTracker: API POST failed', err));

            // Still save locally just in case it is needed by older views
            if (status === 'not_attended') {
                await saveMissedCall({
                    userName,
                    userPhone,
                    portfolioName: activeCall.businessName,
                    phoneDialled: activeCall.phoneNumber,
                });
                setShowOneTouchModal(true);
            }
        } catch (e) {
            console.error('GlobalCallTracker: failed to submit call log', e);
        }
    };

    if (!showAttendedModal && !showOneTouchModal) return null;

    return (
        <View style={styles.wrapperContainer} pointerEvents="box-none">
            {/* ── Modal 1: Was the call attended? ── */}
            <Modal
                visible={showAttendedModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAttendedModal(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconWrap}>
                            <Icon name="phone-check" size={36} color="#3B82F6" />
                        </View>
                        <Text style={styles.modalTitle}>Was the call attended?</Text>
                        <Text style={styles.modalSubtitle}>
                            Let us know if <Text style={{ fontWeight: '800', color: '#1E293B' }}>{activeCall?.businessName}</Text> picked up your call.
                        </Text>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.btnAttended]}
                                onPress={() => handleCallStatus('attended')}
                                activeOpacity={0.85}
                            >
                                <Icon name="check-circle-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.modalBtnText}>Attended</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.btnNotAttended]}
                                onPress={() => handleCallStatus('not_attended')}
                                activeOpacity={0.85}
                            >
                                <Icon name="phone-cancel-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.modalBtnText}>Not Attended</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Modal 2: One Touch confirmation ── */}
            <Modal
                visible={showOneTouchModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOneTouchModal(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <View style={[styles.modalIconWrap, { backgroundColor: '#FEF3C7' }]}>
                            <Icon name="headset" size={36} color="#D97706" />
                        </View>
                        <Text style={styles.modalTitle}>Don't worry!</Text>
                        <Text style={styles.modalSubtitle}>
                            Our <Text style={styles.highlight}>One Touch Team</Text> will call you back
                            very soon. We've noted your request. 🙏
                        </Text>

                        <TouchableOpacity
                            style={[styles.modalBtn, styles.btnOk, { alignSelf: 'center', paddingHorizontal: 40, flex: 0, width: '80%' }]}
                            onPress={() => setShowOneTouchModal(false)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalBtnText}>OK, Thank You!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapperContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 20,
    },
    modalIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    highlight: {
        color: '#D97706',
        fontWeight: '700',
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
    },
    btnAttended: {
        backgroundColor: '#16A34A',
    },
    btnNotAttended: {
        backgroundColor: '#EF4444',
    },
    btnOk: {
        backgroundColor: '#3B82F6',
    },
    modalBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});

export default GlobalCallTracker;
