"use client";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredUsers = availableUsers.filter(
    (user) =>
      !selectedUsers.some((selected) => selected.id === user.id) &&
      (user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleSelectUser = (user: User) => {
    onSelectionChange([...selectedUsers, user]);
    setSearchValue("");
    setOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter((user) => user.id !== userId));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to check if searchValue is a valid email
  const isValidEmail = (input: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };
  // Helper to check if searchValue is a valid username
  const isValidUsername = (input: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(input);
  };

  // If custom input is allowed and searchValue is not empty and not in availableUsers, allow adding
  const canAddCustom =
    allowCustomInput &&
    searchValue.trim().length > 0 &&
    !filteredUsers.some(
      (user) =>
        user.name.toLowerCase() === searchValue.toLowerCase() ||
        user.email.toLowerCase() === searchValue.toLowerCase()
    ) &&
    (isValidEmail(searchValue) || isValidUsername(searchValue));

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 min-h-[44px] flex-wrap cursor-text">
            {/* Selected Users */}
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 bg-white rounded-full pl-1 pr-2 py-1 shadow-sm"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-gray-100 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveUser(user.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Placeholder text when no users selected */}
            {selectedUsers.length === 0 && (
              <span className="text-sm text-gray-500 flex-1">Tedd</span>
            )}

            {/* Show current search or placeholder */}
            {selectedUsers.length > 0 && (
              <span className="text-sm text-gray-900 flex-1">Tedd</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={searchValue}
              onValueChange={setSearchValue}
              autoFocus
            />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.email}`}
                    onSelect={() => handleSelectUser(user)}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {/* Custom input option */}
                {canAddCustom && (
                  <CommandItem
                    key={searchValue}
                    value={searchValue}
                    onSelect={() => {
                      handleSelectUser({
                        id: `custom-${searchValue}`,
                        name: searchValue,
                        email: isValidEmail(searchValue) ? searchValue : "",
                        avatar: undefined,
                      });
                    }}
                    className="flex items-center gap-3 px-4 py-2 text-blue-600"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                        {isValidEmail(searchValue)
                          ? searchValue[0].toUpperCase()
                          : getInitials(searchValue)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="font-medium">
                        Invite "{searchValue}"{" "}
                        {isValidEmail(searchValue) ? "(email)" : "(username)"}
                      </div>
                    </div>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
