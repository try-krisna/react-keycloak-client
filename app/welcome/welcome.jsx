import { useState, useEffect } from "react";
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
  Image,
  Badge,
  Divider,
  SimpleGrid,
  Progress,
  Code,
  Input,
  Collapse,
} from "@chakra-ui/react";
import { FaSignOutAlt, FaUser, FaKey, FaInfo, FaCog, FaSave } from "react-icons/fa";

// Default config (used only if no hash present)
const DEFAULT_CONFIG = {
  url: null,
  realm: null,
  clientId: null
};

// Parse config from URL hash (#url=...&realm=...&client=...)
const parseHashConfig = () => {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    url: params.get("url") || DEFAULT_CONFIG.url,
    realm: params.get("realm") || DEFAULT_CONFIG.realm,
    clientId: params.get("client") || DEFAULT_CONFIG.clientId,
  };
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [tokenLifespan, setTokenLifespan] = useState(null);
  const [showConfigForm, setShowConfigForm] = useState(true); 
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Load config from hash on mount
  useEffect(() => {
    const parsed = parseHashConfig();
    setConfig(parsed);

    // If URL hash has config, skip config form
    if (parsed.url && parsed.realm && parsed.clientId) {
      setShowConfigForm(false);
      initKeycloak(parsed);
    }
  }, []);

  const initKeycloak = async (cfg) => {
    setLoading(true);
    try {
      const kc = new Keycloak({
        url: cfg.url,
        realm: cfg.realm,
        clientId: cfg.clientId,
      });

      const auth = await kc.init({
        onLoad: "login-required",
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe: false,
      });

      setKeycloak(kc);
      setAuthenticated(auth);

      if (auth && kc.tokenParsed) {
        const { exp, iat } = kc.tokenParsed;
        setTokenLifespan(exp - iat);
        setTokenExpiry(exp - Math.floor(Date.now() / 1000));

        const interval = setInterval(() => {
          const now = Math.floor(Date.now() / 1000);
          const remaining = kc.tokenParsed?.exp
            ? Math.max(kc.tokenParsed.exp - now, 0)
            : 0;
          setTokenExpiry(remaining);
          if (remaining === 0) {
            kc.logout();
            clearInterval(interval);
            setAuthenticated(false);
            setKeycloak(null);
            setShowConfigForm(true);
          }
        }, 1000);
      }

      setShowConfigForm(false);
    } catch (err) {
      console.error("Keycloak init error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    initKeycloak(config);
  };

  const handleLogout = () => {
    keycloak?.logout();
    setAuthenticated(false);
    setKeycloak(null);
    setShowConfigForm(true);
  };

  const handleClearConfig = () => {
    setConfig(DEFAULT_CONFIG);
    window.location.hash = "";
    setShowConfigForm(true);
  };

  // Save config -> update hash -> re-init Keycloak
  const handleSaveConfig = () => {
    const newHash = `#url=${encodeURIComponent(config.url)}&realm=${encodeURIComponent(
      config.realm
    )}&client=${encodeURIComponent(config.clientId)}`;
    window.location.hash = newHash;
    setShowConfigForm(false);
    initKeycloak(config);
  };

  const formatTime = (seconds) => {
    if (!seconds) return "N/A";
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

  // --- Config Form shown only if no hash and not logged in ---
  if (showConfigForm && !authenticated) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <Card p={6}>
            <VStack spacing={4}>
              <Heading size="md">Keycloak Config</Heading>
              <Text>Fill fields or use default values</Text>
              <Input
                placeholder={`URL (default: ${DEFAULT_CONFIG.url})`}
                value={config.url}
                onChange={(e) => setConfig((c) => ({ ...c, url: e.target.value }))}
              />
              <Input
                placeholder={`Realm (default: ${DEFAULT_CONFIG.realm})`}
                value={config.realm}
                onChange={(e) => setConfig((c) => ({ ...c, realm: e.target.value }))}
              />
              <Input
                placeholder={`Client ID (default: ${DEFAULT_CONFIG.clientId})`}
                value={config.clientId}
                onChange={(e) => setConfig((c) => ({ ...c, clientId: e.target.value }))}
              />
              <HStack pt={2}>
                <Button colorScheme="blue" leftIcon={<FaSave />} onClick={handleSaveConfig}>
                  Save & Sign In
                </Button>
                <Button colorScheme="red" onClick={handleClearConfig}>
                  Clear
                </Button>
              </HStack>
            </VStack>
          </Card>
        </Center>
      </ChakraProvider>
    );
  }

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

  if (!authenticated) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <Text>Redirecting to Keycloak login...</Text>
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
            {profilePic && (
              <Image src={profilePic} alt="Profile" boxSize="80px" borderRadius="full" />
            )}
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

        {/* Config panel (collapsible after login) */}
        <Collapse in={showConfigPanel} animateOpacity>
          <Card p={4} mb={4}>
            <VStack spacing={3}>
              <Heading size="sm">Keycloak Config</Heading>
              <Input
                placeholder="Keycloak URL"
                value={config.url}
                onChange={(e) => setConfig((c) => ({ ...c, url: e.target.value }))}
              />
              <Input
                placeholder="Realm"
                value={config.realm}
                onChange={(e) => setConfig((c) => ({ ...c, realm: e.target.value }))}
              />
              <Input
                placeholder="Client ID"
                value={config.clientId}
                onChange={(e) => setConfig((c) => ({ ...c, clientId: e.target.value }))}
              />
              <HStack pt={2}>
                <Button colorScheme="blue" leftIcon={<FaSave />} onClick={handleSaveConfig}>
                  Save & Sign In
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
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}h="500px"  >
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
           
            {/* <Code mt={3} p={2} display="block" fontSize="xs" noOfLines={5}>{keycloak.token}</Code> */}
          
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

