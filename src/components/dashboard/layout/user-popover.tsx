import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Crown as CrownIcon } from '@phosphor-icons/react/dist/ssr/Crown';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useAuth } from '@/providers/auth-provider';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { userEmail, userRole, logout } = useAuth();
  const router = useRouter();

  // Generate display name from email if available
  const displayName = React.useMemo(() => {
    if (!userEmail) return 'User';
    
    // If email contains a name part before @, use it and capitalize first letter
    const namePart = userEmail.split('@')[0];
    if (namePart) {
      // Split by common separators and capitalize each part
      return namePart
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    return 'User';
  }, [userEmail]);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error('Sign out error', error);
        return;
      }

      // Use the logout function from auth context
      logout();
    } catch (err) {
      logger.error('Sign out error', err);
    }
  }, [logout]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      onClose={onClose}
      open={open}
      slotProps={{ 
        paper: { 
          sx: { 
            width: '280px',
            overflow: 'visible',
            mt: 1.5,
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'rgba(203, 213, 225, 0.3)',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -10,
              right: 16,
              width: 20,
              height: 20,
              bgcolor: 'background.paper',
              transform: 'rotate(45deg)',
              zIndex: 0,
              borderLeft: '1px solid',
              borderTop: '1px solid',
              borderColor: 'inherit',
            }
          } 
        } 
      }}
    >
      <Box 
        sx={{ 
          p: '20px',
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          position: 'relative',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          pb: '36px'
        }}
      >
        <Box 
          sx={{
            position: 'absolute',
            bottom: -28,
            left: 20,
            borderRadius: '50%',
            border: '4px solid',
            borderColor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Avatar 
            src="/assets/profile.jpeg" 
            sx={{ 
              width: 56, 
              height: 56,
            }}
          />
        </Box>
        {userRole?.includes('admin') && (
          <Box 
            sx={{ 
              position: 'absolute',
              right: 20,
              top: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              borderRadius: '12px',
              py: 0.5,
              px: 1,
            }}
          >
            <CrownIcon weight="fill" color="#14B8A6" fontSize="var(--icon-fontSize-sm)" />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#14B8A6' }}>
              {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ p: '16px 20px', pt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{displayName}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ wordBreak: 'break-all' }}>
          {userEmail || 'No email available'}
        </Typography>
      </Box>
      <Divider sx={{ mx: 2 }} />
      <MenuList 
        disablePadding 
        sx={{ 
          p: '12px 8px', 
          '& .MuiMenuItem-root': { 
            borderRadius: '10px',
            mb: 0.5,
            px: 2,
            py: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(20, 184, 166, 0.08)',
            },
            '& .MuiListItemIcon-root': {
              color: 'text.secondary',
              minWidth: '32px'
            }
          } 
        }}
      >
        <MenuItem component={RouterLink} href={paths.dashboard.account} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>My Profile</Typography>
        </MenuItem>
        <MenuItem component={RouterLink} href={paths.dashboard.settings} onClick={onClose}>
          <ListItemIcon>
            <GearSixIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Settings</Typography>
        </MenuItem>
        <MenuItem 
          onClick={handleSignOut}
          sx={{ 
            color: 'error.main',
            '& .MuiListItemIcon-root': {
              color: 'error.main'
            },
            mt: 1
          }}
        >
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Sign out</Typography>
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
