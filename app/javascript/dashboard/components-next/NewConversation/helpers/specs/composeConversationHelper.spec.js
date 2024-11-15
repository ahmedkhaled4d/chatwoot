import { describe, it, expect, vi } from 'vitest';
import { INBOX_TYPES } from 'dashboard/helper/inbox';
import ContactAPI from 'dashboard/api/contacts';
import * as helpers from '../composeConversationHelper';

vi.mock('dashboard/api/contacts');

describe('composeConversationHelper', () => {
  describe('convertChannelTypeToLabel', () => {
    it('converts channel type with namespace to capitalized label', () => {
      expect(helpers.convertChannelTypeToLabel('Channel::Email')).toBe('Email');
      expect(helpers.convertChannelTypeToLabel('Channel::Whatsapp')).toBe(
        'Whatsapp'
      );
    });

    it('returns original value if no namespace found', () => {
      expect(helpers.convertChannelTypeToLabel('email')).toBe('email');
    });
  });

  describe('generateLabelForContactableInboxesList', () => {
    const contact = {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    };

    it('generates label for email inbox', () => {
      expect(
        helpers.generateLabelForContactableInboxesList({
          ...contact,
          channelType: INBOX_TYPES.EMAIL,
        })
      ).toBe('John Doe (john@example.com)');
    });

    it('generates label for twilio inbox', () => {
      expect(
        helpers.generateLabelForContactableInboxesList({
          ...contact,
          channelType: INBOX_TYPES.TWILIO,
        })
      ).toBe('John Doe (+1234567890)');
    });

    it('generates label for whatsapp inbox', () => {
      expect(
        helpers.generateLabelForContactableInboxesList({
          ...contact,
          channelType: INBOX_TYPES.WHATSAPP,
        })
      ).toBe('John Doe (+1234567890)');
    });

    it('generates label for other inbox types', () => {
      expect(
        helpers.generateLabelForContactableInboxesList({
          ...contact,
          channelType: 'Channel::Api',
        })
      ).toBe('John Doe (Api)');
    });
  });

  describe('buildContactableInboxesList', () => {
    it('returns empty array if no contact inboxes', () => {
      expect(helpers.buildContactableInboxesList(null)).toEqual([]);
      expect(helpers.buildContactableInboxesList(undefined)).toEqual([]);
    });

    it('builds list of contactable inboxes with correct format', () => {
      const inboxes = [
        {
          id: 1,
          name: 'Email Inbox',
          email: 'support@example.com',
          channelType: INBOX_TYPES.EMAIL,
          phoneNumber: null,
        },
      ];

      const result = helpers.buildContactableInboxesList(inboxes);
      expect(result[0]).toMatchObject({
        id: 1,
        label: 'Email Inbox (support@example.com)',
        action: 'inbox',
        value: 1,
        name: 'Email Inbox',
        email: 'support@example.com',
        channelType: INBOX_TYPES.EMAIL,
      });
    });
  });

  describe('getCapitalizedNameFromEmail', () => {
    it('extracts and capitalizes name from email', () => {
      expect(helpers.getCapitalizedNameFromEmail('john.doe@example.com')).toBe(
        'John.doe'
      );
      expect(helpers.getCapitalizedNameFromEmail('jane@example.com')).toBe(
        'Jane'
      );
    });
  });

  describe('processContactableInboxes', () => {
    it('processes inboxes with correct structure', () => {
      const inboxes = [
        {
          inbox: { id: 1, name: 'Inbox 1' },
          sourceId: 'source1',
        },
      ];

      const result = helpers.processContactableInboxes(inboxes);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Inbox 1',
        sourceId: 'source1',
      });
    });
  });

  describe('prepareAttachmentPayload', () => {
    it('prepares direct upload files', () => {
      const files = [{ blobSignedId: 'signed1' }];
      expect(helpers.prepareAttachmentPayload(files, true)).toEqual([
        'signed1',
      ]);
    });

    it('prepares regular files', () => {
      const files = [{ resource: { file: 'file1' } }];
      expect(helpers.prepareAttachmentPayload(files, false)).toEqual(['file1']);
    });
  });

  describe('prepareNewMessagePayload', () => {
    const baseParams = {
      targetInbox: { id: 1, sourceId: 'source1' },
      selectedContact: { id: '2' },
      message: 'Hello',
      currentUser: { id: 3 },
    };

    it('prepares basic message payload', () => {
      const result = helpers.prepareNewMessagePayload(baseParams);
      expect(result).toEqual({
        inboxId: 1,
        sourceId: 'source1',
        contactId: 2,
        message: { content: 'Hello' },
        assigneeId: 3,
      });
    });

    it('includes optional fields when provided', () => {
      const result = helpers.prepareNewMessagePayload({
        ...baseParams,
        subject: 'Test',
        ccEmails: 'cc@test.com',
        bccEmails: 'bcc@test.com',
        attachedFiles: [{ blobSignedId: 'file1' }],
        directUploadsEnabled: true,
      });

      expect(result).toMatchObject({
        mailSubject: 'Test',
        message: {
          content: 'Hello',
          cc_emails: 'cc@test.com',
          bcc_emails: 'bcc@test.com',
        },
        files: ['file1'],
      });
    });
  });

  describe('prepareWhatsAppMessagePayload', () => {
    it('prepares whatsapp message payload', () => {
      const params = {
        targetInbox: { id: 1, sourceId: 'source1' },
        selectedContact: { id: 2 },
        message: 'Hello',
        templateParams: { param1: 'value1' },
        currentUser: { id: 3 },
      };

      const result = helpers.prepareWhatsAppMessagePayload(params);
      expect(result).toEqual({
        inboxId: 1,
        sourceId: 'source1',
        contactId: 2,
        message: {
          content: 'Hello',
          template_params: { param1: 'value1' },
        },
        assigneeId: 3,
      });
    });
  });

  describe('generateContactQuery', () => {
    it('generates correct query structure for contact search', () => {
      const query = 'test@example.com';
      const expected = {
        payload: [
          {
            attribute_key: 'email',
            filter_operator: 'contains',
            values: [query],
            attribute_model: 'standard',
            custom_attribute_type: '',
          },
        ],
      };

      expect(helpers.generateContactQuery({ query })).toEqual(expected);
    });

    it('handles empty query', () => {
      const expected = {
        payload: [
          {
            attribute_key: 'email',
            filter_operator: 'contains',
            values: [''],
            attribute_model: 'standard',
            custom_attribute_type: '',
          },
        ],
      };

      expect(helpers.generateContactQuery({ query: '' })).toEqual(expected);
    });
  });

  describe('API calls', () => {
    describe('searchContacts', () => {
      it('searches contacts and returns camelCase results', async () => {
        const mockPayload = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone_number: '+1234567890',
            created_at: '2023-01-01',
          },
        ];

        ContactAPI.filter.mockResolvedValue({
          data: { payload: mockPayload },
        });

        const result = await helpers.searchContacts('john');

        expect(result).toEqual([
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
            createdAt: '2023-01-01',
          },
        ]);

        expect(ContactAPI.filter).toHaveBeenCalledWith(
          undefined,
          'name',
          helpers.generateContactQuery({ query: 'john' })
        );
      });

      it('handles empty search results', async () => {
        ContactAPI.filter.mockResolvedValue({
          data: { payload: [] },
        });

        const result = await helpers.searchContacts('nonexistent');
        expect(result).toEqual([]);
      });

      it('transforms nested objects to camelCase', async () => {
        const mockPayload = [
          {
            id: 1,
            contact_inboxes: [
              {
                inbox_id: 1,
                source_id: 'source1',
                created_at: '2023-01-01',
              },
            ],
            custom_attributes: {
              custom_field_name: 'value',
            },
          },
        ];

        ContactAPI.filter.mockResolvedValue({
          data: { payload: mockPayload },
        });

        const result = await helpers.searchContacts('test');

        expect(result).toEqual([
          {
            id: 1,
            contactInboxes: [
              {
                inboxId: 1,
                sourceId: 'source1',
                createdAt: '2023-01-01',
              },
            ],
            customAttributes: {
              customFieldName: 'value',
            },
          },
        ]);
      });
    });

    describe('createNewContact', () => {
      it('creates new contact with capitalized name', async () => {
        const mockContact = { id: 1, name: 'John', email: 'john@example.com' };
        ContactAPI.create.mockResolvedValue({
          data: { payload: { contact: mockContact } },
        });

        const result = await helpers.createNewContact('john@example.com');
        expect(result).toEqual(mockContact);
        expect(ContactAPI.create).toHaveBeenCalledWith({
          name: 'John',
          email: 'john@example.com',
        });
      });
    });

    describe('fetchContactableInboxes', () => {
      it('fetches and processes contactable inboxes', async () => {
        const mockInboxes = [
          {
            inbox: { id: 1, name: 'Inbox 1' },
            sourceId: 'source1',
          },
        ];
        ContactAPI.getContactableInboxes.mockResolvedValue({
          data: { payload: mockInboxes },
        });

        const result = await helpers.fetchContactableInboxes(1);
        expect(result[0]).toEqual({
          id: 1,
          name: 'Inbox 1',
          sourceId: 'source1',
        });
        expect(ContactAPI.getContactableInboxes).toHaveBeenCalledWith(1);
      });

      it('returns empty array when no inboxes found', async () => {
        ContactAPI.getContactableInboxes.mockResolvedValue({
          data: { payload: [] },
        });

        const result = await helpers.fetchContactableInboxes(1);
        expect(result).toEqual([]);
      });
    });
  });
});