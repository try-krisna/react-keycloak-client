// // Do some modify of token expird 
// import React, { useState, useEffect } from "react";
// import {
//   ChakraProvider,
//   Box,
//   VStack,
//   HStack,
//   Text,
//   Button,
//   Card,
//   Heading,
//   Spinner,
//   Center,
//   Alert,
//   AlertIcon,
//   Progress,
//   Code,
//   SimpleGrid,
//   Badge,
//   Flex,
//   Divider,
//   Image,
// } from "@chakra-ui/react";
// import { FaShieldAlt, FaSignInAlt, FaSignOutAlt, FaUser, FaKey } from "react-icons/fa";

// // --- Keycloak config ---
// const KEYCLOAK_CONFIG = {
//   url: import.meta.env.VITE_KEYCLOAK_URL,
//   realm: import.meta.env.VITE_KEYCLOAK_REALM,
//   clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
// };

// // Mock profile image URL
// const MOCK_PROFILE = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pinterest.com%2Fideas%2Fnormal-profile-picture%2F928854851498%2F&psig=AOvVaw0TnkScPiaEO0BFz6mE70kI&ust=1755786112181000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJiZnI7LmY8DFQAAAAAdAAAAABAV";

// export default function Welcome() {
//   const [keycloak, setKeycloak] = useState(null);
//   const [authenticated, setAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [tokenExpiry, setTokenExpiry] = useState(null);
//   const [tokenLifespan, setTokenLifespan] = useState(null);

//   // --- Init Keycloak ---
//   useEffect(() => {
//     let interval;
//     const initKeycloak = async () => {
//       try {
//         const Keycloak = (await import("keycloak-js")).default;
//         const kc = new Keycloak(KEYCLOAK_CONFIG);

//         const authenticated = await kc.init({
//           onLoad: "check-sso",
//           checkLoginIframe: false,
//         });

//         setKeycloak(kc);
//         setAuthenticated(authenticated);

//         if (authenticated) {
//           const lifespan = kc.tokenParsed.exp - kc.tokenParsed.iat;
//           setTokenLifespan(lifespan);

//           interval = setInterval(() => {
//             kc.updateToken(30).catch(() => {
//               console.warn("Failed to refresh token");
//               setAuthenticated(false);
//             });
//             updateTokenExpiry(kc);
//           }, 1000);
//         }
//       } catch (err) {
//         console.error("Keycloak init error:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initKeycloak();
//     return () => clearInterval(interval);
//   }, []);

//   const updateTokenExpiry = (kc) => {
//     if (kc.tokenParsed?.exp) {
//       const now = Math.floor(Date.now() / 1000);
//       setTokenExpiry(kc.tokenParsed.exp - now);
//     }
//   };

//   const handleLogin = () => keycloak?.login();
//   const handleLogout = () => keycloak?.logout();

//   const formatTime = (seconds) => {
//     if (!seconds) return "N/A";
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}m ${s}s`;
//   };

//   const getProgressColor = () => {
//     if (tokenExpiry > 300) return "green";
//     if (tokenExpiry > 60) return "yellow";
//     return "red";
//   };

//   if (loading) {
//     return (
//       <ChakraProvider>
//         <Center h="100vh">
//           <VStack>
//             <Spinner size="xl" color="blue.500" />
//             <Text>Loading Keycloak...</Text>
//           </VStack>
//         </Center>
//       </ChakraProvider>
//     );
//   }

//   if (error) {
//     return (
//       <ChakraProvider>
//         <Center h="100vh">
//           <Alert status="error">
//             <AlertIcon />
//             {error}
//           </Alert>
//         </Center>
//       </ChakraProvider>
//     );
//   }

//   if (!authenticated) {
//     return (
//       <ChakraProvider>
//         <Center h="100vh">
//           <Card p={6}>
//             <VStack spacing={4}>
//               <FaShieldAlt size="40" color="blue" />
//               <Heading size="md">Login Required</Heading>
//               <Button leftIcon={<FaSignInAlt />} colorScheme="blue" onClick={handleLogin}>
//                 Login with Keycloak
//               </Button>
//             </VStack>
//           </Card>
//         </Center>
//       </ChakraProvider>
//     );
//   }

//   return (
//     <ChakraProvider>
//       <Box p={6}>
//         <Flex justify="space-between" align="center" mb={4}>
//           <Heading size="lg">Welcome {keycloak.tokenParsed?.preferred_username}</Heading>
//           <Button leftIcon={<FaSignOutAlt />} colorScheme="red" onClick={handleLogout}>
//             Logout
//           </Button>
//         </Flex>

//         <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
//           {/* Profile */}
//           <Card p={4}>
//             <Heading size="sm" mb={2}>
//               <FaUser /> Profile
//             </Heading>
//             <Divider mb={2} />
//             <Center mb={4}>
//               <Image
//                 src={keycloak.tokenParsed?.picture || MOCK_PROFILE}
//                 alt="User profile"
//                 borderRadius="full"
//                 boxSize="100px"
//               />
//             </Center>
//             <Text>Email: {keycloak.tokenParsed?.email}</Text>
//             <Text>
//               Verified:{" "}
//               <Badge colorScheme={keycloak.tokenParsed?.email_verified ? "green" : "red"}>
//                 {keycloak.tokenParsed?.email_verified ? "Yes" : "No"}
//               </Badge>
//             </Text>
//           </Card>

//           {/* Token Info */}
//           <Card p={4}>
//             <Heading size="sm" mb={2}>
//               <FaKey /> Token
//             </Heading>
//             <Divider mb={2} />
//             <Text>Expires in: {formatTime(tokenExpiry)}</Text>
//             <Progress
//               mt={2}
//               value={(tokenExpiry / tokenLifespan) * 100}
//               colorScheme={getProgressColor()}
//             />
//             <Code mt={3} p={2} display="block" fontSize="xs" noOfLines={5}>
//               {keycloak.token}
//             </Code>
//           </Card>

//           {/* JWT Decoded Claims */}
//           <Card p={4} gridColumn={{ base: 1, md: 2 }}>
//             <Heading size="sm" mb={2}>
//               JWT Decoded Claims
//             </Heading>
//             <Divider mb={2} />
//             <Code
//               p={4}
//               display="block"
//               fontSize="xs"
//               whiteSpace="pre-wrap"
//               overflow="auto"
//               maxH="400px"
//             >
//               {JSON.stringify(keycloak.tokenParsed, null, 2)}
//             </Code>
//           </Card>
//         </SimpleGrid>
//       </Box>
//     </ChakraProvider>
//   );
// }

// not proper refresh token

// import React, { useState, useEffect } from "react";
// import {
//   ChakraProvider,
//   Box,
//   VStack,
//   HStack,
//   Text,
//   Button,
//   Card,
//   CardBody,
//   Heading,
//   Spinner,
//   Center,
//   Alert,
//   AlertIcon,
//   SimpleGrid,
//   Progress,
//   Badge,
//   Divider,
//   Code,
//   Flex,
//   Image,
// } from "@chakra-ui/react";
// import { FaSignOutAlt, FaUser, FaKey, FaInfo } from "react-icons/fa";

// // Keycloak configuration
// const KEYCLOAK_CONFIG = {
//   url: import.meta.env.VITE_KEYCLOAK_URL,
//   realm: import.meta.env.VITE_KEYCLOAK_REALM,
//   clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
// };

// export default function Welcome() {
//   const [keycloak, setKeycloak] = useState(null);
//   const [authenticated, setAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [tokenExpiry, setTokenExpiry] = useState(null);
//   const [tokenLifespan, setTokenLifespan] = useState(null);

//   useEffect(() => {
//     let interval;

//     const initKeycloak = async () => {
//       try {
//         const Keycloak = (await import("keycloak-js")).default;
//         const kc = new Keycloak(KEYCLOAK_CONFIG);

//         const auth = await kc.init({
//           onLoad: "check-sso",
//           silentCheckSsoRedirectUri:
//             window.location.origin + "/silent-check-sso.html",
//           checkLoginIframe: false,
//         });

//         setKeycloak(kc);
//         setAuthenticated(auth);

//         if (auth) {
//           // Set token lifespan from actual token
//           setTokenLifespan(kc.tokenParsed.exp - kc.tokenParsed.iat);
//           setTokenExpiry(kc.tokenParsed.exp - Math.floor(Date.now() / 1000));

//           // Refresh token every 30s
//           interval = setInterval(() => {
//             kc.updateToken(30)
//               .then((refreshed) => {
//                 setTokenExpiry(
//                   kc.tokenParsed.exp - Math.floor(Date.now() / 1000)
//                 );
//               })
//               .catch(() => {
//                 console.warn("Failed to refresh token");
//                 setAuthenticated(false);
//               });
//           }, 30000);
//         }
//       } catch (err) {
//         console.error("Keycloak init error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initKeycloak();
//     return () => clearInterval(interval);
//   }, []);

//   const handleLogin = () => keycloak?.login();
//   const handleLogout = () => keycloak?.logout();

//   const formatTime = (seconds) => {
//     if (!seconds) return "N/A";
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}m ${s}s`;
//   };

//   const getProgressColor = () => {
//     if (tokenExpiry > 300) return "green";
//     if (tokenExpiry > 60) return "yellow";
//     return "red";
//   };

//   // --- Loading ---
//   if (loading) {
//     return (
//       <ChakraProvider>
//         <Center h="100vh">
//           <VStack>
//             <Spinner size="xl" color="blue.500" />
//             <Text>Loading Keycloak...</Text>
//           </VStack>
//         </Center>
//       </ChakraProvider>
//     );
//   }

//   // --- Not authenticated ---
//   if (!authenticated) {
//     return (
//       <ChakraProvider>
//         <Center h="100vh">
//           <Card p={6}>
//             <VStack spacing={4}>
//               <Heading size="md">Login Required</Heading>
//               <Button colorScheme="blue" onClick={handleLogin}>
//                 Login with Keycloak
//               </Button>
//             </VStack>
//           </Card>
//         </Center>
//       </ChakraProvider>
//     );
//   }

//   // --- Authenticated UI ---
//   const profilePic =
//     keycloak.tokenParsed?.picture ||
//     "https://via.placeholder.com/80?text=Profile";

//   return (
//     <ChakraProvider>
//       <Box p={6}>
//         <Flex justify="space-between" align="center" mb={4}>
//           <HStack>
//             <Image
//               src={profilePic}
//               alt="Profile"
//               boxSize="80px"
//               borderRadius="full"
//             />
//             <Heading size="lg">
//               Welcome {keycloak.tokenParsed?.given_name || "User"}
//             </Heading>
//           </HStack>
//           <Button colorScheme="red" leftIcon={<FaSignOutAlt />} onClick={handleLogout}>
//             Logout
//           </Button>
//         </Flex>

//         <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
//           {/* Profile Card */}
//           <Card p={4}>
//             <Heading size="sm" mb={2}>
//               <FaUser /> Profile
//             </Heading>
//             <Divider mb={2} />
//             <Text>Username: {keycloak.tokenParsed?.preferred_username}</Text>
//             <Text>Email: {keycloak.tokenParsed?.email}</Text>
//             <Text>
//               Verified:{" "}
//               <Badge
//                 colorScheme={keycloak.tokenParsed?.email_verified ? "green" : "red"}
//               >
//                 {keycloak.tokenParsed?.email_verified ? "Yes" : "No"}
//               </Badge>
//             </Text>
//           </Card>

//           {/* Token Card */}
//           <Card p={4}>
//             <Heading size="sm" mb={2}>
//               <FaKey /> Token Info
//             </Heading>
//             <Divider mb={2} />
//             <Text>Expires in: {formatTime(tokenExpiry)}</Text>
//             <Progress
//               mt={2}
//               value={(tokenExpiry / tokenLifespan) * 100}
//               colorScheme={getProgressColor()}
//             />
//             <Code mt={3} p={2} display="block" fontSize="xs" noOfLines={5}>
//               {keycloak.token}
//             </Code>
//           </Card>

//           {/* JWT Decoded Claims */}
//           <Card p={4} gridColumn={{ md: "span 2" }}>
//             <Heading size="sm" mb={2}>
//               <FaInfo /> JWT Decoded Claims
//             </Heading>
//             <Divider mb={2} />
//             <Code
//               p={3}
//               display="block"
//               fontSize="xs"
//               whiteSpace="pre-wrap"
//               maxH="400px"
//               overflow="auto"
//             >
//               {JSON.stringify(keycloak.tokenParsed, null, 2)}
//             </Code>
//           </Card>
//         </SimpleGrid>
//       </Box>
//     </ChakraProvider>
//   );

// }


// =
import { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { FaSignOutAlt, FaUser, FaKey, FaInfo } from "react-icons/fa";

// Keycloak configuration
const KEYCLOAK_CONFIG = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};
export default function Welcome() {
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [tokenLifespan, setTokenLifespan] = useState(null);

  useEffect(() => {
    let refreshInterval;
    let countdownInterval;

    const initKeycloak = async () => {
      try {
        const kc = new Keycloak(KEYCLOAK_CONFIG);

        // 🔹 Try restoring tokens from localStorage before init
        const storedToken = localStorage.getItem("kc_token");
        const storedRefresh = localStorage.getItem("kc_refreshToken");
        const storedParsed = localStorage.getItem("kc_tokenParsed");

        if (storedToken && storedRefresh && storedParsed) {
          kc.token = storedToken;
          kc.refreshToken = storedRefresh;
          kc.tokenParsed = JSON.parse(storedParsed);
        }

        const auth = await kc.init({
          onLoad: "check-sso",
          silentCheckSsoRedirectUri:
            window.location.origin + "/silent-check-sso.html",
          checkLoginIframe: false,
        });

        setKeycloak(kc);
        setAuthenticated(auth);

        if (auth && kc.tokenParsed) {
          // 💾 Save tokens so refresh keeps countdown correct
          localStorage.setItem("kc_token", kc.token || "");
          localStorage.setItem("kc_refreshToken", kc.refreshToken || "");
          localStorage.setItem(
            "kc_tokenParsed",
            JSON.stringify(kc.tokenParsed || {})
          );

          const exp = kc.tokenParsed.exp;
          const iat = kc.tokenParsed.iat;
          setTokenLifespan(exp - iat);
          setTokenExpiry(exp - Math.floor(Date.now() / 1000));

          // 🔄 Refresh token every 30s before expiry
          // 👉 COMMENT THIS OUT if you want to disable auto-refresh for testing
          // refreshInterval = setInterval(() => {
          //   kc.updateToken(30) // refresh when <30s remaining
          //     .then((refreshed) => {
          //       if (refreshed && kc.tokenParsed) {
          //         console.log("✅ Token refreshed");
          //         // Save new tokens
          //         localStorage.setItem("kc_token", kc.token || "");
          //         localStorage.setItem("kc_refreshToken", kc.refreshToken || "");
          //         localStorage.setItem(
          //           "kc_tokenParsed",
          //           JSON.stringify(kc.tokenParsed || {})
          //         );
          //         // Update expiry
          //         setTokenExpiry(
          //           kc.tokenParsed.exp - Math.floor(Date.now() / 1000)
          //         );
          //       }
          //     })
          //     .catch(() => {
          //       console.warn("❌ Failed to refresh token");
          //       setAuthenticated(false);
          //     });
          // }, 30000);

          // ⏳ Countdown timer every second
          countdownInterval = setInterval(() => {
            setTokenExpiry((prev) => (prev ? Math.max(prev - 1, 0) : 0));
          }, 1000);
        }
      } catch (err) {
        console.error("Keycloak init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const handleLogin = () => keycloak?.login();
  const handleLogout = () => keycloak?.logout();

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "N/A";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getProgressColor = () => {
    if (!tokenExpiry) return "gray";
    if (tokenExpiry > 300) return "green";
    if (tokenExpiry > 60) return "yellow";
    return "red";
  };

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
    keycloak.tokenParsed?.picture ||
    "https://via.placeholder.com/80?text=Profile";

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
          <Button
            colorScheme="red"
            leftIcon={<FaSignOutAlt />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Flex>

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
                colorScheme={
                  keycloak.tokenParsed?.email_verified ? "green" : "red"
                }
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
              value={
                tokenLifespan
                  ? ((tokenExpiry || 0) / tokenLifespan) * 100
                  : 0
              }
              colorScheme={getProgressColor()}
            />
            <Code mt={3} p={2} display="block" fontSize="xs" noOfLines={5}>
              {keycloak.token}
            </Code>
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
              fontSize="xs"
              whiteSpace="pre-wrap"
              maxH="400px"
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
