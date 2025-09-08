<template>
  <div v-if="isOpen" class="relative">
    <!-- Main Menu -->
    <div ref="menuRef" class="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      @click.stop>
      <div class="py-2">
        <!-- Select Messages -->
        <button @click="handleSelectMessages"
          class="w-full px-4 py-2 text-left hover:cursor-pointer text-gray-700 hover:bg-gray-100 flex items-center space-x-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Select Messages</span>
        </button>

        <!-- Group Management Options (Admin Only) -->
        <template v-if="isGroup && isAdmin">
          <hr class="my-1" />

          <!-- Update Group -->
          <button @click="openUpdateGroupDialog"
            class="w-full px-4 hover:cursor-pointer py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Group Info</span>
          </button>

          <!-- Remove Participants -->
          <button @click="showRemoveParticipantsDialog = true"
            class="w-full hover:cursor-pointer px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
            <span>Remove Participants</span>
          </button>

          <!-- Clear Chat (Admin Only) -->
          <button @click="confirmAction('clearChat')"
            class="w-full px-4 hover:cursor-pointer py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear Chat History</span>
          </button>
        </template>

        <!-- Common Options -->
        <hr class="my-1" />

        <!-- Delete/Leave Conversation -->
        <button @click="console.log('Initial delete conversation clicked'); confirmAction('deleteConversation')"
          class="w-full px-4 py-2 hover:cursor-pointer text-left text-red-600 hover:bg-red-50 flex items-center space-x-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{{ isGroup ? 'Leave Group' : 'Delete Conversation' }}</span>
        </button>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="showConfirmDialog = null">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">
          {{ getConfirmTitle() }}
        </h3>

        <p class="text-gray-600 mb-6">
          {{ getConfirmMessage() }}
        </p>

        <div class="flex justify-end space-x-3">
          <button @click="showConfirmDialog = null"
            class="px-4 py-2 hover:cursor-pointer text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button @click="executeConfirmAction"
            class="px-4 py-2 bg-red-600 hover:cursor-pointer text-white hover:bg-red-700 rounded-lg">
            {{ getConfirmButtonText() }}
          </button>
        </div>
      </div>
    </div>
    <!-- Update Group Dialog -->
    <div v-if="showUpdateGroupDialog"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      @click="closeUpdateGroupDialog">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Edit Group Information</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input v-model="groupName" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter group name" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea v-model="groupDescription"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter group description" rows="3" />
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button @click="closeUpdateGroupDialog"
            class="px-4 hover:cursor-pointer py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button @click="handleUpdateGroup" :disabled="!groupName.trim()"
            class="px-4 py-2 hover:cursor-pointer bg-[#014f86] text-white hover:bg-[#013a63] disabled:bg-gray-300 rounded-lg">
            Update Group
          </button>
        </div>
      </div>
    </div>

    <!-- Remove Participants Dialog -->
    <div v-if="showRemoveParticipantsDialog"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      @click="closeRemoveParticipantsDialog">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Remove Participants</h3>

        <div class="max-h-60 overflow-y-auto space-y-2">
          <label v-for="participant in removableParticipants" :key="participant.id"
            class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input v-model="selectedParticipants" :value="participant.id" type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <div class="flex items-center space-x-2">
              <div
                class="w-8 h-8 bg-[#014f86] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {{ participant.username.charAt(0).toUpperCase() }}
              </div>
              <span class="text-gray-700">{{ participant.username }}</span>
            </div>
          </label>
        </div>

        <div v-if="removableParticipants.length === 0" class="text-gray-500 text-center py-4">
          No participants can be removed
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button @click="closeRemoveParticipantsDialog"
            class="px-4 py-2 hover:cursor-pointer text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button @click="handleRemoveParticipants" :disabled="selectedParticipants.length === 0"
            class="px-4 py-2 hover:cursor-pointer bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 rounded-lg">
            Remove Selected ({{ selectedParticipants.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import type { Conversation, User } from '../types/chat'

// Props
const props = defineProps<{
  conversation: Conversation
  currentUser: User | null
  isOpen: boolean
}>()

// Emits
const emit = defineEmits<{
  'close': []
  'clear-chat': []
  'remove-participants': [participantIds: string[]]
  'update-group': [name: string, description?: string]
  'delete-conversation': []
  'toggle-message-selection': []
}>()

// Refs
const menuRef = ref<HTMLElement>()
const showConfirmDialog = ref<string | null>(null)
const showUpdateGroupDialog = ref(false)
const showRemoveParticipantsDialog = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const selectedParticipants = ref<string[]>([])

// Computed properties
const isAdmin = computed(() => {
  return props.conversation?.type === 'group' && props.conversation?.createdBy === props.currentUser?.id
})

const isGroup = computed(() => {
  return props.conversation?.type === 'group'
})

const removableParticipants = computed(() => {
  if (!props.conversation || !isGroup.value) return []

  return props.conversation.participants.filter(
    p => p.id !== props.currentUser?.id && p.id !== props.conversation.createdBy
  )
})

// Methods
const handleClickOutside = (event: Event) => {
  console.log('handleClickOutside called, showConfirmDialog:', showConfirmDialog.value)

  if (showConfirmDialog.value || showUpdateGroupDialog.value || showRemoveParticipantsDialog.value) {
    console.log('Dialog is open, not closing menu')
    return
  }

  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    console.log('Clicking outside menu, closing')
    emit('close')
  }
}

const handleSelectMessages = () => {
  emit('toggle-message-selection')
  emit('close')
}

const confirmAction = (action: string) => {
  console.log('confirmAction called with:', action)
  showConfirmDialog.value = action
}

const executeConfirmAction = () => {
  console.log('executeConfirmAction called with:', showConfirmDialog.value)

  const action = showConfirmDialog.value

  showConfirmDialog.value = null
  switch (action) {
    case 'clearChat':
      console.log('Emitting clear-chat')
      emit('clear-chat')
      break
    case 'deleteConversation':
      console.log('Emitting delete-conversation')
      emit('delete-conversation')
      break
  }

  // Close menu
  emit('close')
}
const openUpdateGroupDialog = () => {
  groupName.value = props.conversation?.name || ''
  groupDescription.value = props.conversation?.description || ''
  showUpdateGroupDialog.value = true
}

const closeUpdateGroupDialog = () => {
  showUpdateGroupDialog.value = false
  groupName.value = ''
  groupDescription.value = ''
}

const handleUpdateGroup = () => {
  if (groupName.value.trim()) {
    emit('update-group', groupName.value.trim(), groupDescription.value.trim() || undefined)
    closeUpdateGroupDialog()
    emit('close')
  }
}

const closeRemoveParticipantsDialog = () => {
  showRemoveParticipantsDialog.value = false
  selectedParticipants.value = []
}

const handleRemoveParticipants = () => {
  if (selectedParticipants.value.length > 0) {
    emit('remove-participants', selectedParticipants.value)
    closeRemoveParticipantsDialog()
    emit('close')
  }
}

const getConfirmTitle = () => {
  switch (showConfirmDialog.value) {
    case 'clearChat':
      return 'Clear Chat History?'
    case 'deleteConversation':
      return isGroup.value ? 'Leave Group?' : 'Delete Conversation?'
    default:
      return 'Confirm Action'
  }
}

watch(() => props.isOpen, (newValue) => {
  console.log('ChatOptionsMenu isOpen changed to:', newValue)
})

watch(() => props.conversation, (newValue) => {
  console.log('ChatOptionsMenu conversation prop:', newValue)
})

const getConfirmMessage = () => {
  switch (showConfirmDialog.value) {
    case 'clearChat':
      return 'This will permanently delete all messages in this chat for everyone. This action cannot be undone.'
    case 'deleteConversation':
      return isGroup.value
        ? 'You will leave this group and no longer receive messages. You can be added back by an admin.'
        : 'This will delete the conversation for you. This action cannot be undone.'
    default:
      return 'Are you sure you want to perform this action?'
  }
}

const getConfirmButtonText = () => {
  switch (showConfirmDialog.value) {
    case 'clearChat':
      return 'Clear History'
    case 'deleteConversation':
      return isGroup.value ? 'Leave Group' : 'Delete'
    default:
      return 'Confirm'
  }
}

// Lifecycle
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
      // Reset all dialogs when menu closes
      showConfirmDialog.value = null
      showUpdateGroupDialog.value = false
      showRemoveParticipantsDialog.value = false
      selectedParticipants.value = []
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>