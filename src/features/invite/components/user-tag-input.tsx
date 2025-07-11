"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type React from "react";
import { X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserTagInputProps {
  availableUsers: User[];
  selectedUsers: User[];
  onSelectionChange: (users: User[]) => void;
  placeholder?: string;
  allowCustomInput?: boolean;
}

export function UserTagInput({
  availableUsers,
  selectedUsers,
  onSelectionChange,
  placeholder = "Search users...",
  allowCustomInput = false,
}: UserTagInputProps) {
  const [searchValue, setSearchValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users not already selected and matching search
  const filteredUsers = availableUsers.filter(
    (user) =>
      !selectedUsers.some((selected) => selected.id === user.id) &&
      (user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleSelectUser = (user: User) => {
    console.log("Selecting user:", user); // Debug log
    onSelectionChange([...selectedUsers, user]);
    setSearchValue("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter((user) => user.id !== userId));
    inputRef.current?.focus();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Custom input logic
  const isValidEmail = (input: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };
  const isValidUsername = (input: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(input);
  };
  const canAddCustom =
    allowCustomInput &&
    searchValue.trim().length > 0 &&
    !filteredUsers.some(
      (user) =>
        user.name.toLowerCase() === searchValue.toLowerCase() ||
        user.email.toLowerCase() === searchValue.toLowerCase()
    ) &&
    (isValidEmail(searchValue) || isValidUsername(searchValue));

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Handle dropdown open/close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        // Check if click is on dropdown items
        const target = e.target as Element;
        if (!target.closest("[data-dropdown-container]")) {
          setDropdownOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, true);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [dropdownOpen]);

  // Keyboard navigation for dropdown
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  useEffect(() => {
    setHighlightedIndex(0);
  }, [dropdownOpen, searchValue, filteredUsers.length]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setDropdownOpen(true);
      return;
    }
    if (dropdownOpen) {
      const totalOptions = filteredUsers.length + (canAddCustom ? 1 : 0);
      if (e.key === "ArrowDown") {
        setHighlightedIndex((i) => (i + 1) % totalOptions);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setHighlightedIndex((i) => (i - 1 + totalOptions) % totalOptions);
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (highlightedIndex < filteredUsers.length) {
          handleSelectUser(filteredUsers[highlightedIndex]);
        } else if (canAddCustom && highlightedIndex === filteredUsers.length) {
          handleSelectUser({
            id: `custom-${searchValue}`,
            name: searchValue,
            email: isValidEmail(searchValue) ? searchValue : "",
            avatar: undefined,
          });
        }
        e.preventDefault();
      } else if (e.key === "Escape") {
        setDropdownOpen(false);
        e.preventDefault();
      }
    }
    // Remove last tag with Backspace if input is empty
    if (
      e.key === "Backspace" &&
      searchValue === "" &&
      selectedUsers.length > 0
    ) {
      handleRemoveUser(selectedUsers[selectedUsers.length - 1].id);
    }
  };

  const dropdownContent = dropdownOpen &&
    (filteredUsers.length > 0 || canAddCustom) && (
      <div
        data-dropdown-container="true"
        className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-[300px] overflow-auto"
        style={{
          position: "fixed",
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 99999,
          pointerEvents: "auto",
          cursor: "default",
        }}
        role="listbox"
      >
        {filteredUsers.map((user, idx) => {
          const isHighlighted = idx === highlightedIndex;
          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors min-w-0 first:rounded-t-xl last:rounded-b-xl ${
                isHighlighted ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              style={{
                cursor: "pointer",
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Mouse down on user:", user);
                handleSelectUser(user);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Mouse up on user:", user);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Click on user:", user);
                handleSelectUser(user);
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
              role="option"
              aria-selected={isHighlighted ? true : false}
            >
              {user.avatar ? (
                <img
                  src={user.avatar || ""}
                  alt={user.name}
                  className="h-8 w-8 rounded-full shrink-0"
                />
              ) : (
                <span className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(user.name)}
                </span>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-sm text-foreground truncate">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </div>
          );
        })}
        {canAddCustom && (
          <div
            className="flex items-center gap-3 px-3 sm:px-4 py-3 text-blue-600 transition-colors min-w-0 first:rounded-t-xl last:rounded-b-xl hover:bg-blue-50"
            style={{
              cursor: "pointer",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Mouse down on custom user:", searchValue);
              handleSelectUser({
                id: `custom-${searchValue}`,
                name: searchValue,
                email: isValidEmail(searchValue) ? searchValue : "",
                avatar: undefined,
              });
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Mouse up on custom user:", searchValue);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Click on custom user:", searchValue);
              handleSelectUser({
                id: `custom-${searchValue}`,
                name: searchValue,
                email: isValidEmail(searchValue) ? searchValue : "",
                avatar: undefined,
              });
            }}
            role="option"
            aria-selected={
              filteredUsers.length === highlightedIndex ? true : false
            }
          >
            <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold shrink-0">
              {isValidEmail(searchValue)
                ? searchValue[0].toUpperCase()
                : getInitials(searchValue)}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-sm truncate">
                Invite &quot;{searchValue}&quot;
              </span>
              <span className="text-xs text-gray-500">
                {isValidEmail(searchValue)
                  ? "Email"
                  : isValidUsername(searchValue)
                    ? "Username"
                    : null}
              </span>
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-start flex-wrap gap-1 sm:gap-2 bg-transparent border border-gray-200 rounded-full px-3 py-2 min-h-[2.5rem] w-full min-w-0 focus-within:ring-0 transition"
        onClick={() => inputRef.current?.focus()}
        tabIndex={0}
        aria-label="User selection input"
      >
        {selectedUsers.map((user) => (
          <span
            key={user.id}
            className="shrink-0 flex items-center rounded-full bg-gray-100 px-2 py-1 mb-1 text-foreground text-xs font-medium shadow-sm max-w-[180px]"
          >
            {user.avatar ? (
              <img
                src={user.avatar || ""}
                alt={user.name}
                className="h-5 w-5 rounded-full mr-2"
              />
            ) : (
              <span className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center mr-2 text-xs font-bold">
                {getInitials(user.name)}
              </span>
            )}
            <span className="text-xs truncate max-w-[120px]">{user.name}</span>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label={`Remove ${user.name}`}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveUser(user.id);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm text-foreground focus:ring-0 px-1 mt-1"
          placeholder={selectedUsers.length === 0 ? placeholder : ""}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleInputKeyDown}
          aria-label="Add user by name or email"
        />
      </div>
      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
}
