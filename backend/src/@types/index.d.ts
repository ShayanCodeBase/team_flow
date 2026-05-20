declare global {
  namespace Express {
    interface User {
      _id?: any;
      name?: string | null;
      email?: string;
      profilePicture?: string | null;
      isActive?: boolean;
      lastLogin?: Date | null;
      currentWorkspace?: any;
      createdAt?: Date;
      updatedAt?: Date;
    }
  }
}

export {};
