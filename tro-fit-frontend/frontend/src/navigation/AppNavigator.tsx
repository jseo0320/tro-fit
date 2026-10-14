import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnalyzingScreen from '../screens/AnalyzingScreen';
import ExerciseFeedbackScreen from '../screens/ExerciseFeedbackScreen';
import ExercisePlayerScreen from '../screens/ExercisePlayerScreen';
import GeneratingDanceScreen from '../screens/GeneratingDanceScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MeasurementGuideScreen from '../screens/MeasurementGuideScreen';
import MeasurementScreen from '../screens/MeasurementScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import MyPageScreen from '../screens/MyPageScreen';
import SignupScreen from '../screens/SignupScreen';
import SplashScreen from '../screens/SplashScreen';
import WeeklyDanceLibraryScreen from '../screens/WeeklyDanceLibraryScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#FFF8EE',
          },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="MeasurementGuide" component={MeasurementGuideScreen} />
        <Stack.Screen name="Measurement" component={MeasurementScreen} />
        <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
        <Stack.Screen name="GeneratingDance" component={GeneratingDanceScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MyPage" component={MyPageScreen} />
        <Stack.Screen name="WeeklyDanceLibrary" component={WeeklyDanceLibraryScreen} />
        <Stack.Screen name="ExercisePlayer" component={ExercisePlayerScreen} />
        <Stack.Screen name="ExerciseFeedback" component={ExerciseFeedbackScreen} />
        <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
