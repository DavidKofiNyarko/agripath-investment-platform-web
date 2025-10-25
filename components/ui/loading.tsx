"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  text,
  className = "",
}) => {
  const pathname = usePathname();

  // Debug: Log the current pathname
  React.useEffect(() => {
    console.log("Loading component - Current pathname:", pathname);
  }, [pathname]);

  const sizeClasses = {
    sm: "w-16 h-14",
    md: "w-24 h-20",
    lg: "w-32 h-28",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Route-specific loading messages
  const getRouteSpecificMessages = (path: string) => {
    const routeMessages: { [key: string]: string[] } = {
      "/": [
        "Setting up your experience...",
        "Welcome to AgriPath...",
        "Getting things ready...",
        "Almost there...",
      ],
      "/dashboard": [
        "Loading your dashboard...",
        "Preparing your overview...",
        "Getting your data...",
        "Almost ready...",
      ],
      "/portfolio": [
        "Loading your portfolio...",
        "Fetching your investments...",
        "Preparing portfolio data...",
        "Almost there...",
      ],
      "/investments": [
        "Loading investment opportunities...",
        "Finding the best projects...",
        "Preparing investment data...",
        "Almost ready...",
      ],
      "/transactions": [
        "Loading your transactions...",
        "Fetching transaction history...",
        "Preparing transaction data...",
        "Almost there...",
      ],
      "/updates": [
        "Loading latest updates...",
        "Fetching project updates...",
        "Preparing update data...",
        "Almost ready...",
      ],
      "/signin": [
        "Redirecting you to dashboard...",
        "Signing you in...",
        "Almost there...",
        "Welcome back...",
      ],
      "/signup": [
        "Setting up your account...",
        "Creating your profile...",
        "Almost ready...",
        "Welcome to AgriPath...",
      ],
      "/loading": [
        "Loading AgriPath...",
        "Setting things up...",
        "Almost ready...",
        "Just a moment...",
      ],
    };

    // Find the best matching route
    for (const [route, messages] of Object.entries(routeMessages)) {
      if (path.startsWith(route)) {
        return messages;
      }
    }

    // Default messages for unknown routes
    return [
      "Just a moment...",
      "Almost there...",
      "Getting things ready...",
      "Preparing your data...",
      "Loading your content...",
      "Setting things up...",
      "Almost ready...",
      "Just a second more...",
    ];
  };

  const loadingMessages = getRouteSpecificMessages(pathname);

  // Debug: Log the selected messages
  React.useEffect(() => {
    console.log("Loading component - Selected messages:", loadingMessages);
  }, [loadingMessages]);

  const [currentMessage, setCurrentMessage] = React.useState(
    text || loadingMessages[0]
  );

  React.useEffect(() => {
    // If custom text is provided, don't cycle through messages
    if (text) {
      setCurrentMessage(text);
      return;
    }

    // Cycle through route-specific messages
    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [text, loadingMessages]);

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-6 ${className}`}
    >
      {/* AgriPath Logo with Animated Fill */}
      <motion.div
        className={sizeClasses[size]}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 58 49"
          fill="none"
          className="w-full h-full"
        >
          <motion.path
            d="M57.0835 21.9015V21.4635L57.2015 19.6817L57.1204 19.7485V19.0803C57.1204 18.917 57.1204 18.7462 57.1204 18.5755V17.9667L56.5453 17.7439C53.0709 16.413 49.441 15.5372 45.745 15.138V6.36258L49.1804 8.23349L49.7776 7.11242L36.537 0L24.0042 6.73379L24.6013 7.85485L27.7935 6.13985V8.24091L19.4923 12.6955L20.0895 13.8165L22.2496 12.6583V18.1374C20.581 18.3694 18.8986 18.4861 17.2143 18.4864C16.6295 18.4864 16.0471 18.4715 15.4671 18.4418C15.4934 17.5636 15.5771 16.6881 15.7177 15.8211C15.8062 15.487 15.961 15.383 16.2559 15.4498C16.6341 15.5234 17.0257 15.4773 17.3768 15.3178C17.7279 15.1583 18.0214 14.8932 18.2169 14.5589C18.5118 14.1506 18.5192 14.158 18.1432 13.9279C18.1131 13.9098 18.0857 13.8873 18.0621 13.8611C17.8926 13.6859 17.6828 13.5557 17.4513 13.4818C17.2198 13.408 16.9738 13.3929 16.7351 13.4379C16.4286 13.4748 16.1436 13.6152 15.9266 13.8364C15.7097 14.0576 15.5737 14.3463 15.5408 14.6555C15.6145 14.7223 15.6882 14.5144 15.7915 14.6555C15.5722 15.0065 15.3847 15.3768 15.2312 15.7617C15.0976 15.0849 14.8127 14.4476 14.3981 13.8982C14.8183 14.0689 14.951 14.5589 15.2091 14.945C15.2547 14.5866 15.1794 14.2231 14.9953 13.913C14.7737 13.5172 14.4157 13.2169 13.9891 13.0692C13.5625 12.9214 13.0968 12.9364 12.6804 13.1112C12.5919 13.1558 12.4887 13.2374 12.4076 13.2226C11.9726 13.1186 12.1422 13.423 12.2085 13.6383C12.3239 14.1799 12.6145 14.6677 13.0348 15.0251C13.455 15.3825 13.9813 15.5894 14.5308 15.6132C14.7815 15.6132 14.8699 15.7171 14.8847 16.0215C14.8994 16.3259 14.8847 17.6623 14.8847 18.4195C13.714 18.3488 12.5476 18.2175 11.3902 18.0261C11.3957 15.5394 11.5955 13.057 11.9874 10.6018C12.2085 9.77773 12.5993 9.5253 13.3144 9.68864C15.3196 10.1638 16.9342 9.28773 18.2538 7.46136C18.991 6.47394 18.991 6.48136 18.0695 5.91712C17.995 5.87062 17.9279 5.81306 17.8704 5.74636C17.4567 5.31559 16.9423 4.99613 16.3744 4.81715C15.8065 4.63818 15.203 4.6054 14.6193 4.72182C13.866 4.80641 13.1638 5.14648 12.6279 5.68615C12.0921 6.22582 11.7543 6.933 11.6704 7.69151C11.862 7.86227 12.0316 7.35 12.2823 7.76576C11.7557 8.63165 11.2972 9.5377 10.911 10.4756C10.5751 8.81629 9.87485 7.25368 8.86153 5.90227C9.90102 6.32545 10.2254 7.52818 10.852 8.48591C10.9674 7.60762 10.7856 6.71576 10.336 5.95424C9.2154 3.9497 6.50241 2.98455 4.65934 3.97939C4.43818 4.09076 4.18752 4.29864 3.9811 4.24667C2.92686 4.00909 3.33234 4.74409 3.50927 5.27121C4.53401 8.3003 6.41394 9.91879 9.13431 10.0376C9.75358 10.0376 9.97474 10.3048 10.0042 11.0398C10.0337 11.7748 10.078 16.415 10.0042 17.7662C7.11169 17.1821 4.30143 16.2421 1.63672 14.9673L0.523503 14.4253L0.331825 15.6948C-0.685434 22.3528 0.653219 29.1589 4.1138 34.9236L4.44555 35.4508C6.16756 38.1789 8.33043 40.5979 10.8447 42.6077L11.4934 43.0977C15.3333 45.9826 19.8343 47.8442 24.5792 48.51L25.8104 48.6362C26.7312 48.7321 27.6565 48.7791 28.5823 48.7773C32.7933 48.7758 36.952 47.8378 40.7613 46.0303V46.1491L42.6928 45.0429C43.2163 44.7385 43.7323 44.4267 44.2336 44.0926C47.9494 41.6595 51.0486 38.385 53.2837 34.5305C55.5187 30.6762 56.8275 26.3487 57.1056 21.8941L57.0835 21.9015ZM24.2401 46.55C24.0484 46.55 23.8567 46.4758 23.665 46.4386C23.2817 46.3644 22.9278 46.2976 22.515 46.2085L21.8293 46.0229L20.812 45.7482C20.5761 45.6739 20.3401 45.5849 20.0747 45.5032C19.8093 45.4215 19.4334 45.2953 19.1237 45.1765L18.3865 44.8795L17.4871 44.4935L16.7499 44.1445L15.9536 43.7065L15.2164 43.3056L14.3981 42.8082L13.7125 42.3553L13.2775 42.0509C17.2865 34.8117 23.3234 28.9214 30.6351 25.115C37.9468 21.3087 46.2096 19.7546 54.3926 20.6468C47.8773 22.4292 41.8603 25.7068 36.8132 30.2228C31.7661 34.7387 27.826 40.3703 25.3017 46.6762C24.9478 46.6762 24.5939 46.6094 24.2401 46.55ZM11.7072 40.8482L11.4123 40.5958L10.8078 40.0761L10.4687 39.7568L9.94526 39.252L9.59876 38.8956L9.12693 38.4056L8.78044 38.027L8.3381 37.5221L8.00635 37.1212C7.86628 36.9505 7.7262 36.7797 7.5935 36.6015L7.26912 36.1783L6.88577 35.6586L6.57613 35.2058L6.42131 34.9533C11.6201 27.396 19.127 21.7548 27.8009 18.8873C28.2481 18.7536 28.6979 18.6126 29.15 18.4641C37.011 16.1479 45.3734 16.1995 53.2057 18.6126C52.1293 18.5309 51.0456 18.4864 49.9766 18.4864C42.2142 18.4803 34.5899 20.5536 27.8857 24.4937C21.1814 28.4337 15.6384 34.0987 11.8252 40.9076L11.7072 40.8482ZM54.9087 24.2402C54.9087 24.3664 54.9087 24.4926 54.8497 24.6188C54.8055 24.8786 54.7612 25.1385 54.7096 25.3612C54.658 25.5839 54.5843 25.9255 54.5253 26.2076C54.4663 26.4897 54.4074 26.7124 54.341 26.95C54.2747 27.1876 54.1788 27.5068 54.0977 27.7815C54.0166 28.0562 53.9577 28.2567 53.8839 28.5239C53.8808 28.561 53.8808 28.5983 53.8839 28.6353L53.6185 29.3777C53.5448 29.5708 53.4785 29.7712 53.3974 29.9642C53.3163 30.1573 53.331 30.135 53.3015 30.2167L53.014 30.8923L52.7707 31.4268C52.7707 31.5011 52.7044 31.5679 52.6749 31.6421C52.5569 31.8871 52.4316 32.1247 52.3136 32.3845L51.9671 33.0527C51.8271 33.3126 51.6723 33.5576 51.5248 33.7952L51.1488 34.4336C50.9866 34.6861 50.8171 34.9311 50.6549 35.1761L50.301 35.6958L50.1093 35.9556L49.6965 36.4976C49.5933 36.6312 49.4901 36.7723 49.3869 36.8985L49.1288 37.2177L48.657 37.7671L48.3695 38.0938L48.1188 38.3759L47.5364 38.9698L47.0498 39.4673C46.8139 39.69 46.5707 39.8979 46.3126 40.1132C46.0546 40.3285 46.0104 40.3953 45.8482 40.5289L45.6344 40.7071L45.0151 41.2045L44.6686 41.4792L44.2705 41.7688L43.7987 42.1029C45.9278 35.2915 49.7524 29.1422 54.9087 24.2402ZM36.5001 1.38833L44.4253 5.65727V15.0044C43.2531 14.9079 42.0736 14.8559 40.8793 14.8559C36.8616 14.8537 32.8627 15.4083 28.9952 16.5041V5.45682L36.5001 1.38833ZM23.4512 11.9827L27.7345 9.68121V16.8827L27.1595 17.0683H27.1005C25.8873 17.4171 24.657 17.7021 23.4144 17.9221L23.4512 11.9827ZM2.07168 17.2465C6.83252 19.342 11.9744 20.4166 17.1701 20.4018C18.04 20.4018 18.9099 20.4018 19.7725 20.3127C14.0677 23.4719 9.13195 27.8693 5.32285 33.1864C3.08436 29.1762 1.90885 24.6532 1.90949 20.0529C1.91063 19.1155 1.95984 18.1788 2.05693 17.2465H2.07168ZM27.2848 46.8767C29.6616 41.1858 33.2509 36.0902 37.7988 31.9503C42.3467 27.8103 47.7422 24.7271 53.6038 22.9186C47.7002 28.5413 43.4786 35.717 41.4174 43.6323C37.4936 45.8035 33.089 46.9424 28.6118 46.9435C28.14 46.9138 27.705 46.8989 27.2701 46.8767H27.2848Z"
            fill="transparent"
            stroke="#0B7430"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="400"
            initial={{
              strokeDashoffset: 400,
              fill: "none",
            }}
            animate={{
              strokeDashoffset: [400, 0, 0],
              fill: ["none", "none", "#0B7430"],
            }}
            transition={{
              duration: 4,
              times: [0, 0.7, 1],
              repeat: Infinity,
              repeatDelay: 1,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          />
        </svg>
      </motion.div>

      {/* Human Loading Text */}
      <motion.p
        key={currentMessage}
        className={`text-gray-600 ${textSizeClasses[size]} font-medium`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {currentMessage}
      </motion.p>
    </div>
  );
};

export default Loading;
