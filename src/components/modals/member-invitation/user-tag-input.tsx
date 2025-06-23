"use client";
import { useState, useRef, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

  // Handle dropdown open/close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-center flex-nowrap gap-2 bg-transparent border border-gray-200 rounded-full px-2 h-10 w-full min-w-0 max-w-[370px] overflow-x-auto focus-within:ring-0 transition scrollbar-none"
        onClick={() => inputRef.current?.focus()}
        tabIndex={0}
        aria-label="User selection input"
      >
        {selectedUsers.map((user) => (
          <span
            key={user.id}
            className="shrink-0 flex items-center rounded-full bg-gray-100 px-2 py-1 mr-1 text-foreground text-xs font-medium shadow-sm"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-5 w-5 rounded-full mr-2"
              />
            ) : (
              <span className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center mr-2 text-xs font-bold">
                {getInitials(user.name)}
              </span>
            )}
            <span className="text-xs">{user.name}</span>
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
          className="flex-1 min-w-[50px] border-none outline-none bg-transparent text-sm text-foreground focus:ring-0 px-1"
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
      {dropdownOpen && (filteredUsers.length > 0 || canAddCustom) && (
        <ul
          className="absolute left-0 mt-2 w-full bg-white border-1 border-border rounded-xl shadow-lg z-10 max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredUsers.map((user, idx) => {
            const isHighlighted = idx === highlightedIndex;
            const ariaSelected = isHighlighted ? "true" : "false";
            return (
              <li
                key={user.id}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 rounded-xl ${
                  isHighlighted ? "bg-gray-200" : ""
                }`}
                onMouseDown={() => handleSelectUser(user)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                role="option"
                aria-selected={ariaSelected}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                    {getInitials(user.name)}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-foreground">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </li>
            );
          })}
          {canAddCustom &&
            (() => {
              const isHighlighted = filteredUsers.length === highlightedIndex;
              const ariaSelected = isHighlighted ? "true" : "false";
              return (
                <li
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-xl"
                  onMouseDown={() => {
                    handleSelectUser({
                      id: `custom-${searchValue}`,
                      name: searchValue,
                      email: isValidEmail(searchValue) ? searchValue : "",
                      avatar: undefined,
                    });
                  }}
                  role="option"
                  aria-selected={ariaSelected}
                >
                  <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">
                    {isValidEmail(searchValue)
                      ? searchValue[0].toUpperCase()
                      : getInitials(searchValue)}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">Invite "{searchValue}"</span>
                    <span className="text-sm text-gray-500">
                      {isValidEmail(searchValue)
                        ? "Email"
                        : isValidUsername(searchValue)
                        ? "Username"
                        : null}
                    </span>
                  </div>
                </li>
              );
            })()}
        </ul>
      )}
    </div>
  );
}
