import React, { useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import {
  ChakraProvider,
  Box,
  Center,
  VStack,
  Spinner,
  Text,
  Heading,
  Button,
  Image,
  Flex,
  HStack,
  Card,
  Divider,
  Badge,
  Progress,
  Code,
  SimpleGrid,
  Input,
} from "@chakra-ui/react";
import { FaSignOutAlt, FaUser, FaKey, FaInfo, FaCog } from "react-icons/fa";

// Default Keycloak configuration
const DEFAULT_CONFIG = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

export default function Welcome() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configSet, setConfigSet] = useState(false); // form submitted
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null); // seconds remaining
  const [tokenLifespan, setTokenLifespan] = useState(null); // exp - iat
  const [showConfigForm, setShowConfigForm] = useState(true); // control form visibility

  // Initialize Keycloak whenever config is set
  useEffect(() => {
    if (!configSet) return;

    let countdownInterval;

    const initKeycloak = async () => {
      try {
        setLoading(true);
        const kc = new Keycloak({
          url: config.url || DEFAULT_CONFIG.url,
          realm: config.realm || DEFAULT_CONFIG.realm,
          clientId: config.clientId || DEFAULT_CONFIG.clientId,
        });

        const storedToken = localStorage.getItem("kc_token");
        const storedRefresh = localStorage.getItem("kc_refreshToken");

        const auth = await kc.init({
          onLoad: "check-sso",
          silentCheckSsoRedirectUri:
            window.location.origin + "/silent-check-sso.html",
          checkLoginIframe: false,
          ...(storedToken && storedRefresh
            ? { token: storedToken, refreshToken: storedRefresh }
            : {}),
        });

        setKeycloak(kc);
        setAuthenticated(auth);

        if (auth && kc.tokenParsed) {
          // Save tokens
          localStorage.setItem("kc_token", kc.token || "");
          localStorage.setItem("kc_refreshToken", kc.refreshToken || "");

          const { exp, iat } = kc.tokenParsed;
          setTokenLifespan(exp - iat);
          setTokenExpiry(exp - Math.floor(Date.now() / 1000));

          // Countdown + auto logout when token expires
          countdownInterval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const expNow = kc.tokenParsed?.exp;
            const remaining = expNow ? Math.max(expNow - now, 0) : 0;
            setTokenExpiry(remaining);

            if (remaining === 0) {
              kc.logout();
              setAuthenticated(false);
              localStorage.removeItem("kc_token");
              localStorage.removeItem("kc_refreshToken");
              clearInterval(countdownInterval);
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Keycloak init error:", err);
      } finally {
        setLoading(false);
        setShowConfigForm(false); // hide form after init
      }
    };

    initKeycloak();

    return () => {
      clearInterval(countdownInterval);
    };
  }, [configSet]);

  const handleLogin = () => keycloak?.login();
  const handleLogout = () => {
    keycloak?.logout();
    setAuthenticated(false);
    localStorage.removeItem("kc_token");
    localStorage.removeItem("kc_refreshToken");
  };

  const checkToken = async () => {
    if (!keycloak?.token) return;
    try {
      const res = await fetch(
        `${config.url || DEFAULT_CONFIG.url}/realms/${
          config.realm || DEFAULT_CONFIG.realm
        }/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        }
      );

      if (!res.ok) {
        console.log("Token invalid or expired:", res.status);
        handleLogout();
      } else {
        const data = await res.json();
        console.log("Token valid, user info:", data);
      }
    } catch (err) {
      console.error("Error checking token:", err);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${m}:${pad(s)}`;
  };

  const getProgressColor = () => {
    if (tokenExpiry === null || tokenExpiry === undefined) return "gray";
    if (tokenExpiry > 300) return "green";
    if (tokenExpiry > 60) return "yellow";
    return "red";
  };

  // --- Config Form ---
  if (showConfigForm && !authenticated) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <Card p={6}>
            <VStack spacing={4}>
              <Heading size="md">Keycloak Config</Heading>
              <Text>Leave blank to use default values</Text>

              <Input
                placeholder={`URL (default: ${DEFAULT_CONFIG.url})`}
                value={config.url}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, url: e.target.value }))
                }
              />
              <Input
                placeholder={`Realm (default: ${DEFAULT_CONFIG.realm})`}
                value={config.realm}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, realm: e.target.value }))
                }
              />
              <Input
                placeholder={`Client ID (default: ${DEFAULT_CONFIG.clientId})`}
                value={config.clientId}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, clientId: e.target.value }))
                }
              />

              <Button colorScheme="blue" onClick={() => setConfigSet(true)}>
                Save & Continue
              </Button>
            </VStack>
          </Card>
        </Center>
      </ChakraProvider>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <VStack>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading Keycloak...</Text>
          </VStack>
        </Center>
      </ChakraProvider>
    );
  }

  // --- Not authenticated ---
  if (!authenticated) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <Card p={6}>
            <VStack spacing={4}>
              <Heading size="md">Login Required</Heading>
              <Button colorScheme="blue" onClick={handleLogin}>
                Login with Keycloak
              </Button>
            </VStack>
          </Card>
        </Center>
      </ChakraProvider>
    );
  }

  // --- Authenticated UI ---
  const profilePic =
    keycloak.tokenParsed?.picture

  return (
    <ChakraProvider>
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            <Image
              src={profilePic}
              alt="Profile"
              boxSize="80px"
              borderRadius="full"
            />
            <Heading size="lg">
              Welcome {keycloak.tokenParsed?.given_name || "User"}
            </Heading>
          </HStack>
          <HStack>
            <Button
              colorScheme="red"
              leftIcon={<FaSignOutAlt />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </HStack>
        </Flex>
    <Card p={4}>
            <Heading size="sm" mb={2}>
              {/* <FaUser />  */}
              Keycloak Info
            </Heading>
            <Divider mb={2} />
    <Text>URL: {DEFAULT_CONFIG.url}</Text>
            <Text>Realm:  {DEFAULT_CONFIG.realm}</Text>
            <Text>Client: {DEFAULT_CONFIG.clientId}</Text>
            
        
            
          </Card>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Profile Card */}
          <Card p={4}>
            <Heading size="sm" mb={2}>
              <FaUser /> Profile
            </Heading>
            <Divider mb={2} />
            <Text>Username: {keycloak.tokenParsed?.preferred_username}</Text>
            <Text>Email: {keycloak.tokenParsed?.email}</Text>
            <Text>
              Verified:{" "}
              <Badge
                colorScheme={keycloak.tokenParsed?.email_verified ? "green" : "red"}
              >
                {keycloak.tokenParsed?.email_verified ? "Yes" : "No"}
              </Badge>
            </Text>
          </Card>

          {/* Token Card */}
          <Card p={4}>
            <Heading size="sm" mb={2}>
              <FaKey /> Token Info
            </Heading>
            <Divider mb={2} />
            <Text>Expires in: {formatTime(tokenExpiry)}</Text>
            <Progress
              mt={2}
              value={tokenLifespan ? ((tokenExpiry || 0) / tokenLifespan) * 100 : 0}
              colorScheme={getProgressColor()}
            />
            <Code mt={3} p={2} display="block" fontSize="xs" noOfLines={5} maxHeight={""}>
              {keycloak.token}
            </Code>
            <Button mt={2} size="sm" onClick={checkToken}>
              Check Token Validity
            </Button>
          </Card>

          {/* JWT Decoded Claims */}
          <Card p={4} gridColumn={{ md: "span 2" }}>
            <Heading size="sm" mb={2}>
              <FaInfo /> JWT Decoded Claims
            </Heading>
            <Divider mb={2} />
            <Code
              p={3}
              display="block"
              fontSize="md"
              whiteSpace="pre-wrap"
              maxH="500px"
              overflow="auto"
            >
              {JSON.stringify(keycloak.tokenParsed, null, 2)}
            </Code>
          </Card>
        </SimpleGrid>
      </Box>
    </ChakraProvider>
  );
}
