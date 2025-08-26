import { useState, useEffect, useRef } from "react";
import Keycloak from "keycloak-js";
import {
  ChakraProvider,
  Center,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Card,
  Box,
  Flex,
  HStack,
  Input,
  Select,
  Divider,
  Collapse,
  SimpleGrid,
  Badge,
  Progress,
  Code,
  Image,
} from "@chakra-ui/react";
import { FaSignOutAlt, FaUser, FaKey, FaInfo, FaCog, FaSave } from "react-icons/fa";

// --- Default Config ---
const DEFAULT_CONFIG = {
  url: "http://localhost:8080",
  realm: "myrealm",
  clientId: "myclient",
  clientSecret: "",
  pkceMethod: "none", // "none", "S256", "plain"
};

// --- Load config from localStorage (browser only) ---
const loadConfig = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("kcConfig");
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  }
  return DEFAULT_CONFIG;
};

export default function App() {
  const [config, setConfig] = useState(loadConfig);
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [tokenLifespan, setTokenLifespan] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const intervalRef = useRef(null);

  // Init Keycloak
  const initKeycloak = async (cfg) => {
    setLoading(true);
    try {
      // clear any old interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const kc = new Keycloak({
        url: cfg.url,
        realm: cfg.realm,
        clientId: cfg.clientId,
      });

      const auth = await kc.init({
        onLoad: "check-sso",
        pkceMethod: cfg.pkceMethod !== "none" ? cfg.pkceMethod : undefined,
        checkLoginIframe: false,
      });

      setKeycloak(kc);
      setAuthenticated(auth);

      if (auth && kc.tokenParsed) {
        const { exp, iat } = kc.tokenParsed;
        setTokenLifespan(exp - iat);

        const updateRemaining = () => {
          const now = Math.floor(Date.now() / 1000);
          const remaining = kc.tokenParsed?.exp
            ? Math.max(kc.tokenParsed.exp - now, 0)
            : 0;
          setTokenExpiry(remaining);
          if (remaining === 0) {
            kc.logout();
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setAuthenticated(false);
            setKeycloak(null);
          }
        };

        updateRemaining();
        intervalRef.current = setInterval(updateRemaining, 1000);
      }
    } catch (err) {
      console.error("Keycloak init error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config && !authenticated) {
      initKeycloak(config);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSignIn = () => {
    if (!keycloak) {
      alert("Keycloak not initialized!");
      return;
    }
    keycloak.login();
  };

  const handleLogout = () => {
    keycloak?.logout();
    setAuthenticated(false);
    setKeycloak(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleSaveConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kcConfig", JSON.stringify(config));
    }
    initKeycloak(config);
  };

  const handleClearConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kcConfig");
    }
    setConfig(DEFAULT_CONFIG);
    setAuthenticated(false);
    setKeycloak(null);
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "N/A";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getProgressColor = () => {
    if (!tokenExpiry) return "gray";
    if (tokenExpiry > 300) return "green";
    if (tokenExpiry > 60) return "yellow";
    return "red";
  };

  // Loading state
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

  // Config form if not authenticated
  if (!authenticated) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <Card p={6}>
            <VStack spacing={4}>
              <Heading size="md">Keycloak Config</Heading>
              <Input
                placeholder="Keycloak URL"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
              <Input
                placeholder="Realm"
                value={config.realm}
                onChange={(e) => setConfig({ ...config, realm: e.target.value })}
              />
              <Input
                placeholder="Client ID"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              />
              <Input
                placeholder="Client Secret (optional)"
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              />
              <Select
                value={config.pkceMethod}
                onChange={(e) => setConfig({ ...config, pkceMethod: e.target.value })}
              >
                <option value="none">No PKCE</option>
                <option value="S256">PKCE - S256</option>
                <option value="plain">PKCE - Plain</option>
              </Select>
              <HStack pt={2}>
                <Button colorScheme="blue" leftIcon={<FaSave />} onClick={handleSaveConfig}>
                  Save Config
                </Button>
                <Button colorScheme="red" onClick={handleClearConfig}>
                  Clear
                </Button>
              </HStack>
              <Button colorScheme="green" mt={2} onClick={handleSignIn}>
                Sign In
              </Button>
            </VStack>
          </Card>
        </Center>
      </ChakraProvider>
    );
  }

  const profilePic = keycloak.tokenParsed?.picture;

  return (
    <ChakraProvider>
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            {profilePic && <Image src={profilePic} alt="Profile" boxSize="80px" borderRadius="full" />}
            <Heading size="lg">Welcome {keycloak.tokenParsed?.given_name || "User"}</Heading>
          </HStack>
          <HStack>
            <Button colorScheme="red" leftIcon={<FaSignOutAlt />} onClick={handleLogout}>
              Logout
            </Button>
            <Button leftIcon={<FaCog />} onClick={() => setShowConfigPanel((s) => !s)}>
              Config
            </Button>
          </HStack>
        </Flex>

        <Collapse in={showConfigPanel} animateOpacity>
          <Card p={4} mb={4}>
            <VStack spacing={3}>
              <Heading size="sm">Keycloak Config</Heading>
              <Input
                placeholder="Keycloak URL"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
              <Input
                placeholder="Realm"
                value={config.realm}
                onChange={(e) => setConfig({ ...config, realm: e.target.value })}
              />
              <Input
                placeholder="Client ID"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              />
              <Input
                placeholder="Client Secret"
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              />
              <Select
                value={config.pkceMethod}
                onChange={(e) => setConfig({ ...config, pkceMethod: e.target.value })}
              >
                <option value="none">No PKCE</option>
                <option value="S256">PKCE - S256</option>
                <option value="plain">PKCE - Plain</option>
              </Select>
              <HStack pt={2}>
                <Button colorScheme="blue" leftIcon={<FaSave />} onClick={handleSaveConfig}>
                  Save & Re-Login
                </Button>
                <Button colorScheme="red" onClick={handleClearConfig}>
                  Clear
                </Button>
              </HStack>
            </VStack>
          </Card>
        </Collapse>

        <Card p={4} mb={6}>
          <Heading size="sm" mb={2}>Keycloak Info</Heading>
          <Divider mb={2} />
          <Text>URL: {config.url}</Text>
          <Text>Realm: {config.realm}</Text>
          <Text>Client: {config.clientId}</Text>
          <Text>PKCE: {config.pkceMethod}</Text>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} h="500px">
          <Card p={4}>
            <Heading size="sm" mb={2}><FaUser /> Profile</Heading>
            <Divider mb={2} />
            <Text>Username: {keycloak.tokenParsed?.preferred_username}</Text>
            <Text>Email: {keycloak.tokenParsed?.email}</Text>
            <Text>
              Verified:{" "}
              <Badge colorScheme={keycloak.tokenParsed?.email_verified ? "green" : "red"}>
                {keycloak.tokenParsed?.email_verified ? "Yes" : "No"}
              </Badge>
            </Text>
          </Card>

          <Card p={4}>
            <Heading size="sm" mb={2}><FaKey /> Token Info</Heading>
            <Divider mb={2} />
            <Text>Expires in: {formatTime(tokenExpiry)}</Text>
            <Progress mt={2} value={tokenLifespan ? (tokenExpiry / tokenLifespan) * 100 : 0} colorScheme={getProgressColor()} />
            <Code p={3} display="block" fontSize="md" whiteSpace="pre-wrap" maxH="500px" overflow="auto">
              {keycloak.token}
            </Code>
          </Card>

          <Card p={4} gridColumn={{ md: "span 2" }}>
            <Heading size="sm" mb={2}><FaInfo /> JWT Decoded Claims</Heading>
            <Divider mb={2} />
            <Code p={3} display="block" fontSize="md" whiteSpace="pre-wrap" maxH="500px" overflow="auto">
              {JSON.stringify(keycloak.tokenParsed, null, 2)}
            </Code>
          </Card>
        </SimpleGrid>
      </Box>
    </ChakraProvider>
  );
}
