from django.test import TestCase
from .pagination import CustomPageNumberPagination


class CustomPaginationTest(TestCase):
    def test_custom_pagination_settings(self):
        paginator = CustomPageNumberPagination()
        self.assertEqual(paginator.page_size, 10)
        self.assertEqual(paginator.page_size_query_param, 'page_size')
        self.assertEqual(paginator.max_page_size, 100) 